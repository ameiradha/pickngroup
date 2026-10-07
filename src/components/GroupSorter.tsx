import React, { useState, useEffect } from 'react';
import { 
  Users, Shuffle, Copy, Check, Plus, Minus, ArrowLeftRight, Trash2, 
  Sparkles, Download, Edit2, CheckCircle, GripVertical, ListFilter
} from 'lucide-react';

interface Group {
  id: string;
  name: string;
  members: string[];
}

interface GroupSorterProps {
  names: string[];
  onChangeNames: (newNames: string) => void;
  isSpinning: boolean;
}

export default function GroupSorter({ names, onChangeNames, isSpinning }: GroupSorterProps) {
  const [numGroups, setNumGroups] = useState<number>(() => {
    const saved = localStorage.getItem('won_groups_count');
    return saved ? parseInt(saved, 10) : 4;
  });
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');
  
  // Quick student moving state
  const [movingStudent, setMovingStudent] = useState<{ student: string; fromGroupId: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('won_groups_count', numGroups.toString());
  }, [numGroups]);

  // Clean name lists
  const validNames = names.map(n => n.trim()).filter(n => n.length > 0);

  // Distribute names into groups
  const sortIntoGroups = () => {
    if (validNames.length === 0) return;
    setIsSorting(true);

    setTimeout(() => {
      // Shuffle names array
      const shuffled = [...validNames];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Initialize empty groups
      const newGroups: Group[] = Array.from({ length: numGroups }, (_, index) => ({
        id: `group-${index + 1}-${Math.random().toString(36).substring(2, 5)}`,
        name: `Group ${index + 1}`,
        members: []
      }));

      // Distribute names evenly
      shuffled.forEach((name, idx) => {
        const groupIdx = idx % numGroups;
        newGroups[groupIdx].members.push(name);
      });

      setGroups(newGroups);
      setIsSorting(false);
    }, 600); // realistic sorting tick animation duration
  };

  // Re-sort current groups if any names change, or if a student was moved
  const handleMoveStudent = (student: string, fromGroupId: string, toGroupId: string) => {
    setGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === fromGroupId) {
          return {
            ...group,
            members: group.members.filter(m => m !== student)
          };
        }
        if (group.id === toGroupId) {
          return {
            ...group,
            members: [...group.members, student]
          };
        }
        return group;
      });
    });
    setMovingStudent(null);
  };

  // Delete a student from the active groups & trigger parent list update
  const handleDeleteStudent = (student: string, fromGroupId: string) => {
    setGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === fromGroupId) {
          return {
            ...group,
            members: group.members.filter(m => m !== student)
          };
        }
        return group;
      });
    });

    // Remove from parent list too
    const updatedNames = validNames.filter(n => n !== student);
    onChangeNames(updatedNames.join('\n'));
  };

  // Copy Group Sorter text output to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;
    
    const textOutput = groups
      .map(group => {
        const membersList = group.members.length > 0 ? group.members.join(', ') : '(Empty)';
        return `${group.name} (${group.members.length} members):\n${membersList}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(textOutput)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  // Inline rename group
  const startRenameGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setTempGroupName(group.name);
  };

  const saveGroupName = (groupId: string) => {
    if (tempGroupName.trim() === '') return;
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: tempGroupName.trim() } : g));
    setEditingGroupId(null);
  };

  const handleGroupNameKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter') {
      saveGroupName(groupId);
    } else if (e.key === 'Escape') {
      setEditingGroupId(null);
    }
  };

  // Preset Colors for Group Headings for visual style
  const groupColors = [
    'from-rose-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-rose-600',
    'from-lime-500 to-emerald-600'
  ];

  return (
    <div className="w-full flex flex-col gap-6" id="group-sorter-container">
      {/* Sorter Controls Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        
        {/* Left Control Column: Group counts */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-700">Target Groups:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setNumGroups(prev => Math.max(2, prev - 1))}
              className="p-1.5 hover:bg-white active:scale-95 text-slate-500 rounded-lg transition-all"
              title="Decrease group count"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={2}
              max={50}
              value={numGroups}
              onChange={(e) => setNumGroups(Math.max(2, Math.min(50, parseInt(e.target.value, 10) || 2)))}
              className="w-12 text-center font-bold text-slate-800 bg-transparent outline-none text-sm"
            />
            <button
              onClick={() => setNumGroups(prev => Math.min(50, prev + 1))}
              className="p-1.5 hover:bg-white active:scale-95 text-slate-500 rounded-lg transition-all"
              title="Increase group count"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick info metadata without pill wrapper */}
          <div className="text-xs text-slate-400 font-medium">
            {validNames.length} pupils total · ~{Math.ceil(validNames.length / numGroups)} per group
          </div>
        </div>

        {/* Right Actions Column */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {groups.length > 0 && (
            <button
              onClick={handleCopyGroups}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              title="Copy group configuration"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Groups'}</span>
            </button>
          )}

          <button
            onClick={sortIntoGroups}
            disabled={validNames.length === 0 || isSorting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap"
          >
            <Shuffle className={`w-4 h-4 ${isSorting ? 'animate-spin' : ''}`} />
            <span>{groups.length > 0 ? 'Shuffle Again' : 'Sort into Groups'}</span>
          </button>
        </div>
      </div>

      {/* Sorting Loading Screen */}
      {isSorting && (
        <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center gap-3 py-16 animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <h3 className="text-sm font-extrabold text-slate-700 tracking-tight">Dividing pupils...</h3>
          <p className="text-xs text-slate-400">Randomizing lists and balancing class sizes</p>
        </div>
      )}

      {/* Empty State */}
      {!isSorting && groups.length === 0 && (
        <div className="flex-1 min-h-[350px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Groups Sorted Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Specify how many groups you want, make sure you have pupil names on the right, and hit <strong className="text-blue-500">Sort into Groups</strong>!
          </p>
        </div>
      )}

      {/* Main Groups Grid layout */}
      {!isSorting && groups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 flex-1 overflow-y-auto max-h-[600px] pr-1">
          {groups.map((group, groupIdx) => {
            const headingGradient = groupColors[groupIdx % groupColors.length];

            return (
              <div 
                key={group.id} 
                className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md group/card"
              >
                {/* Group Card Header */}
                <div className={`p-4 bg-gradient-to-r ${headingGradient} text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-1.5 w-full mr-2">
                    {editingGroupId === group.id ? (
                      <input
                        type="text"
                        value={tempGroupName}
                        onChange={(e) => setTempGroupName(e.target.value)}
                        onBlur={() => saveGroupName(group.id)}
                        onKeyDown={(e) => handleGroupNameKeyDown(e, group.id)}
                        autoFocus
                        className="bg-white/25 border-0 focus:ring-1 focus:ring-white rounded px-2 py-0.5 text-sm font-bold text-white outline-none w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 group/title cursor-pointer w-full" onClick={() => startRenameGroup(group)}>
                        <h4 className="text-sm font-extrabold tracking-tight truncate">{group.name}</h4>
                        <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-80 transition-opacity shrink-0" />
                      </div>
                    )}
                  </div>
                  
                  {/* Item counter - Unboxed pure text */}
                  <span className="text-[11px] font-black tracking-wider bg-white/20 px-2 py-0.5 rounded text-white whitespace-nowrap">
                    {group.members.length} {group.members.length === 1 ? 'pupil' : 'pupils'}
                  </span>
                </div>

                {/* Group Card Body / Member list */}
                <div className="p-3.5 flex-1 flex flex-col justify-between min-h-[160px] bg-slate-50/40">
                  
                  {group.members.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-6 text-xs text-slate-300 italic">
                      Empty Group
                    </div>
                  ) : (
                    <ul className="space-y-1.5 flex-1">
                      {group.members.map((member) => (
                        <li 
                          key={member}
                          className="flex items-center justify-between px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-2xs group/member transition-all hover:border-slate-300/80 hover:bg-slate-50/30"
                        >
                          <span className="text-xs font-bold text-slate-700 break-words whitespace-normal flex-1 min-w-0 mr-2">{member}</span>
                          
                          {/* Student manual swap action controls */}
                          <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => setMovingStudent({ student: member, fromGroupId: group.id })}
                              className="p-1 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-colors"
                              title={`Move ${member} to another group`}
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(member, group.id)}
                              className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors"
                              title={`Remove ${member} from class`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Move Student Dialog Modal Backdrop */}
      {movingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl">
            <h4 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2 mb-1.5">
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
              <span>Move Pupil</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Where would you like to move <strong className="text-slate-800 font-bold">{movingStudent.student}</strong>?
            </p>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {groups
                .filter(g => g.id !== movingStudent.fromGroupId)
                .map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleMoveStudent(movingStudent.student, movingStudent.fromGroupId, group.id)}
                    className="w-full text-left text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-blue-200 transition-all flex items-center justify-between"
                  >
                    <span>{group.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({group.members.length} currently)</span>
                  </button>
                ))}
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setMovingStudent(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
