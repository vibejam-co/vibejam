
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const upsertDraft = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { jamId, patch } = data;
    const uid = context.auth.uid;
    try {
        let docRef = jamId ? db.collection("jams").doc(jamId) : db.collection("jams").doc();
        const updates = { ...patch, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
        if (!jamId) {
            updates.creatorId = uid;
            updates.status = "draft";
            updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await docRef.set(updates, { merge: true });
        return { ok: true, jamId: docRef.id };
    } catch (error: any) { throw new functions.https.HttpsError("internal", error.message); }
});

export const signal = functions.https.onCall(async (data, context) => {
    const { type, jamId } = data;
    if (!jamId) throw new functions.https.HttpsError("invalid-argument", "Missing jamId.");
    const jamRef = db.collection("jams").doc(jamId);
    if (type === 'view') await jamRef.update({ "stats.views": admin.firestore.FieldValue.increment(1) });
    return { ok: true };
});

export const toggleUpvote = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const { jamId } = data;
    const uid = context.auth.uid;
    const voteRef = db.doc(`users/${uid}/upvotes/${jamId}`);
    const jamRef = db.doc(`jams/${jamId}`);
    await db.runTransaction(async (t) => {
        const voteDoc = await t.get(voteRef);
        if (voteDoc.exists) {
            t.delete(voteRef);
            t.update(jamRef, { "stats.upvotes": admin.firestore.FieldValue.increment(-1) });
        } else {
            t.set(voteRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
            t.update(jamRef, { "stats.upvotes": admin.firestore.FieldValue.increment(1) });
        }
    });
    return { ok: true };
});
