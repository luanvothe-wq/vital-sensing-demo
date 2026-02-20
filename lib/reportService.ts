import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = process.env.NODE_ENV === "production" ? "vital_reports" : "vital_reports_dev";

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
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAllReports(): Promise<TeamReport[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TeamReport, "id">),
  }));
}
