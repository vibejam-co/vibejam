/**
 * Simple local storage management for draft state persistency.
 */
export const jamLocalStore = {
  saveDraft(data: any) {
    localStorage.setItem('jam_draft', JSON.stringify(data));
  },
  getDraft() {
    const d = localStorage.getItem('jam_draft');
    return d ? JSON.parse(d) : null;
  },
  clearDraft() {
    localStorage.removeItem('jam_draft');
  }
};
