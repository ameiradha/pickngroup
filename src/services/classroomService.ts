import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Classroom } from '../types';

export interface UserClassroomDocument {
  id: string;
  name: string;
  names: string[];
  lastModified: string;
  createdAt?: any;
  updatedAt?: any;
}

export function subscribeUserClassrooms(
  userId: string, 
  onUpdate: (classrooms: Classroom[]) => void,
  onError?: (error: Error) => void
) {
  const classroomsRef = collection(db, 'users', userId, 'classrooms');
  const q = query(classroomsRef, orderBy('lastModified', 'desc'));

  return onSnapshot(
    q, 
    (snapshot) => {
      const items: Classroom[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || 'Untitled Class',
          names: Array.isArray(data.names) ? data.names : [],
          lastModified: data.lastModified || new Date().toLocaleDateString()
        };
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error fetching classrooms from Firestore:', err);
      // Fallback query if index or order issue
      const fallbackUnsub = onSnapshot(classroomsRef, (snap) => {
        const items: Classroom[] = snap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Untitled Class',
            names: Array.isArray(data.names) ? data.names : [],
            lastModified: data.lastModified || new Date().toLocaleDateString()
          };
        });
        onUpdate(items);
      }, (fallbackErr) => {
        if (onError) onError(fallbackErr);
      });
      return fallbackUnsub;
    }
  );
}

export async function saveUserClassroom(
  userId: string, 
  classroomData: { id?: string; name: string; names: string[] }
): Promise<string> {
  const classroomsRef = collection(db, 'users', userId, 'classrooms');
  const docId = classroomData.id || doc(classroomsRef).id;
  const classDocRef = doc(db, 'users', userId, 'classrooms', docId);

  await setDoc(classDocRef, {
    id: docId,
    userId,
    name: classroomData.name,
    names: classroomData.names,
    lastModified: new Date().toLocaleDateString(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  return docId;
}

export async function deleteUserClassroom(userId: string, classroomId: string): Promise<void> {
  const classDocRef = doc(db, 'users', userId, 'classrooms', classroomId);
  await deleteDoc(classDocRef);
}

export async function syncUserProfile(user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): Promise<void> {
  if (!user.uid) return;
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    lastLogin: serverTimestamp()
  }, { merge: true });
}
