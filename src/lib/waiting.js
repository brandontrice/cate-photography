// Derived note state: who a note is waiting on. Never entered, always
// computed, so it cannot go stale.
//
// The rule: a note waits on whoever did not speak last. A self-reminder
// (you wrote it, nobody replied) waits on you. A full thread waits on its
// originator to resolve.

import { displayName, otherName } from "../admin/names";

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
  // Pure court rule: an unanswered note waits on whoever did not write the
  // last message. Questions land in the other person's queue, which is the
  // common case; notes-to-self flip back the moment anyone replies.
  return { key: "reply", email: last === me ? null : lastAuthor, mine: last !== me };
}

export function waitingLabel(w, myEmail) {
  const other = w.email ? displayName(w.email) : otherName(myEmail);
  if (w.key === "resolve") return w.mine ? "You resolve" : `${other} resolves`;
  return w.mine ? "Waiting on you" : `Waiting on ${other}`;
}
