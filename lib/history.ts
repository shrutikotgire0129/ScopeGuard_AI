import clientPromise from "@/lib/mongodb";
import type { Collection } from "mongodb";

export type EvidenceItem = {
  agreementText: string;
  interpretation: string;
};

export type ScopeAnalysis = {
  status: "included" | "potentially_out_of_scope";
  reason: string;
  evidence: EvidenceItem[];
  recommendedAction: string;
};

export type SavedAnalysis = {
  id: string;
  userId: string;
  createdAt: string;
  agreement: string;
  clientRequest: string;
  analysis: ScopeAnalysis;
};

async function getHistoryCollection(): Promise<Collection<SavedAnalysis>> {
  const client = await clientPromise;
  const database = client.db("scopeguard");
  const collection = database.collection<SavedAnalysis>("analyses");

  return collection;
}

export async function saveAnalysis(record: SavedAnalysis): Promise<void> {
  const collection = await getHistoryCollection();
  await collection.insertOne(record);
}

export async function getRecentAnalyses(
  userId: string,
): Promise<SavedAnalysis[]> {
  const collection = await getHistoryCollection();

  return collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
}

export async function deleteRecentAnalyses(userId: string): Promise<void> {
  const collection = await getHistoryCollection();

  await collection.deleteMany({ userId });
}
