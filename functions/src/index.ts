import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    await admin.firestore().collection('profiles').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName || 'Maker',
        photoURL: user.photoURL || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        badges: []
    });
});
