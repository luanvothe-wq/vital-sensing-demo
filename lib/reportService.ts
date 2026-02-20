import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export interface TeamReport {
  id: string;
  bpm: string;
  bpv1: string;
  bpv0: string;
  S2: string;
  LTv: string;
  score: number;
  statusKey: string;
  createdAt: { toDate: () => Date } | null;
}

export async function saveReport(data: Omit<TeamReport, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "vital_reports"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAllReports(): Promise<TeamReport[]> {
  const q = query(collection(db, "vital_reports"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TeamReport, "id">),
  }));
}
