import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  FolderOpen, 
  LogOut, 
  Sparkles, 
  Check, 
  Cloud, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Classroom } from '../types';
import { 
  subscribeUserClassrooms, 
  saveUserClassroom, 
  deleteUserClassroom 
} from '../services/classroomService';

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNames: string;
  onLoadNames: (names: string) => void;
}

export default function ClassroomModal({
  isOpen,
  onClose,
  currentNames,
  onLoadNames,
}: ClassroomModalProps) {
  const { user, signInWithGoogle, logout, authError, clearAuthError } = useAuth();
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Subscribe to user's classrooms in Firestore when authenticated
  useEffect(() => {
    if (!user) {
      setClassrooms([]);
      setLoadingClasses(false);
      return;
    }

    setLoadingClasses(true);
    const unsubscribe = subscribeUserClassrooms(
      user.uid,
      (data) => {
        setClassrooms(data);
        setLoadingClasses(false);
      },
      (err) => {
        console.error('Failed to subscribe to classrooms:', err);
        setLoadingClasses(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    clearAuthError();
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newClassName.trim()) return;

    const namesList = currentNames
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (namesList.length === 0) {
      alert('The current name list is empty. Please enter some names on the wheel first!');
      return;
    }

    if (classrooms.some(c => c.name.toLowerCase() === newClassName.trim().toLowerCase())) {
      alert('A class with this name already exists. Please choose a different name.');
      return;
    }

    setIsSaving(true);
    try {
      const newId = await saveUserClassroom(user.uid, {
        name: newClassName.trim(),
        names: namesList,
      });
      setActiveClassId(newId);
      setNewClassName('');
      showToast(`Saved "${newClassName.trim()}" with ${namesList.length} names!`);
    } catch (err) {
      console.error('Error saving class:', err);
      alert('Failed to save classroom. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateClass = async (classId: string, className: string) => {
    if (!user) return;
    const namesList = currentNames
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (namesList.length === 0) {
      alert('The current name list is empty!');
      return;
    }

    if (!window.confirm(`Update "${className}" with the current ${namesList.length} names from the wheel?`)) {
      return;
    }

    try {
      await saveUserClassroom(user.uid, {
        id: classId,
        name: className,
        names: namesList,
      });
      showToast(`Updated "${className}" with ${namesList.length} names.`);
    } catch (err) {
      console.error('Error updating class:', err);
      alert('Failed to update class. Please try again.');
    }
  };

  const handleLoadClass = (classroom: Classroom) => {
    onLoadNames(classroom.names.join('\n'));
    setActiveClassId(classroom.id);
    showToast(`Loaded ${classroom.names.length} names from "${classroom.name}"!`);
  };

  const handleDeleteClass = async (classId: string, className: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    if (window.confirm(`Are you sure you want to permanently delete "${className}"?`)) {
      try {
        await deleteUserClassroom(user.uid, classId);
        if (activeClassId === classId) setActiveClassId(null);
        showToast(`Deleted class "${className}".`);
      } catch (err) {
        console.error('Error deleting class:', err);
        alert('Failed to delete class.');
      }
    }
  };

  const currentCount = currentNames.split('\n').filter(n => n.trim().length > 0).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={e => e.stopPropagation()}
        id="classroom-saver-modal"
      >
        {/* Toast alert */}
        {notification && (
          <div className="absolute top-4 right-14 bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg z-50 animate-fadeIn flex items-center gap-1.5 border border-slate-700">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Classroom Saver</h3>
              <p className="text-[11px] text-slate-500 font-medium">Save, organize & sync your student lists</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            id="close-classroom-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Auth State: NOT LOGGED IN */}
          {!user ? (
            <div className="text-center py-6 px-4 bg-gradient-to-b from-blue-50/60 to-slate-50 border border-blue-100 rounded-2xl space-y-4">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                <Cloud className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Google Sign-In Required
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  To use <span className="font-bold text-slate-800">Classroom Saver</span>, you need to sign in with your Google account. Your class rosters are stored securely in your private cloud storage.
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{authError}</span>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-300 text-slate-700 font-bold text-sm rounded-xl shadow-xs transition-all hover:border-slate-400"
                  id="btn-google-login"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase">Private Cloud</span>
                  <span className="text-[11px] text-slate-500 font-medium">Synced via Firebase</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase">Instant Load</span>
                  <span className="text-[11px] text-slate-500 font-medium">1-click to Wheel</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase">Multiple Lists</span>
                  <span className="text-[11px] text-slate-500 font-medium">Organize rosters</span>
                </div>
              </div>
            </div>
          ) : (
            /* Auth State: LOGGED IN */
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Google User'} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200 shadow-xs object-cover" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user.displayName || 'Google Teacher'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Sign Out of Google"
                  id="btn-google-signout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Saved Classrooms List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Saved Classrooms ({classrooms.length})
                  </h4>
                  {loadingClasses && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  )}
                </div>

                {classrooms.length === 0 && !loadingClasses ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200/70 rounded-2xl bg-slate-50/50">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No saved classrooms yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Save your current names below to keep a persistent class list.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {classrooms.map(c => {
                      const isActive = activeClassId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            isActive
                              ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                              : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                              {c.names.length}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {c.names.slice(0, 4).join(', ')}{c.names.length > 4 ? '...' : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => handleLoadClass(c)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              title="Load names into wheel"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Load</span>
                            </button>
                            <button
                              onClick={() => handleUpdateClass(c.id, c.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Overwrite with current wheel names"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClass(c.id, c.name, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete classroom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Current List Form */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Save Current Wheel Names
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {currentCount} names ready to save
                  </span>
                </div>
                <form onSubmit={handleCreateClass} className="flex gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    placeholder="e.g. Grade 5 Math, Team Alpha..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSaving || currentCount === 0}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Save to Cloud</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
