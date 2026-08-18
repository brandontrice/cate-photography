// Derived note state: who a note is waiting on. Never entered, always
// computed, so it cannot go stale.
//
// The rule: a note waits on whoever did not speak last. A self-reminder
// (you wrote it, nobody replied) waits on you. A full thread waits on its
// originator to resolve.

export function waitingOn(note, myEmail) {
  const me = (myEmail || "").toLowerCase();
  const replies = note.note_replies || [];
  const lastAuthor = (replies.length ? replies[replies.length - 1].author : note.author) || "";
  const last = lastAuthor.toLowerCase();

  if (replies.length >= 2) {
    return {
      key: "resolve",
      email: note.author,
      mine: (note.author || "").toLowerCase() === me,
    };
  }
  if (replies.length === 0 && last === me) {
    // My own note with no reply yet: a reminder to me until someone answers.
    return { key: "reply", email: myEmail, mine: true };
  }
  return { key: "reply", email: last === me ? null : lastAuthor, mine: last !== me };
}

export function waitingLabel(w, displayName) {
  if (w.key === "resolve") return w.mine ? "You resolve" : `${displayName(w.email)} resolves`;
  return w.mine ? "Waiting on you" : `Waiting on ${displayName(w.email)}`;
}
