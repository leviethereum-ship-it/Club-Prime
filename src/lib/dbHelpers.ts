import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError, firebaseAvailable } from "./firebase";
import { Property, Booking, ConciergeTicket, LegalTermVersion } from "../types";

// User database operations
export async function saveUserProfile(uid: string, name: string, email: string, role: string) {
  if (!firebaseAvailable) {
    console.log("[Mock] Saved user profile:", { uid, name, email, role });
    return { uid, name, email, role };
  }
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, "users", uid);
    const profile = {
      id: uid,
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    };
    await setDoc(userDocRef, profile);
    return profile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fetchUserProfile(uid: string) {
  if (!firebaseAvailable) return null;
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, "users", uid);
    const sn = await getDoc(userDocRef);
    if (sn.exists()) {
      return sn.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

// listen snapshot functions
export function subscribeToProperties(onUpdate: (properties: Property[]) => void) {
  if (!firebaseAvailable) return () => {};
  const ref = collection(db, "properties");
  return onSnapshot(ref, (snap) => {
    const result: Property[] = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() } as Property);
    });
    onUpdate(result);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, "properties");
  });
}

export function subscribeToBookings(onUpdate: (bookings: Booking[]) => void) {
  if (!firebaseAvailable) return () => {};
  const ref = collection(db, "bookings");
  return onSnapshot(ref, (snap) => {
    const result: Booking[] = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() } as Booking);
    });
    onUpdate(result);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, "bookings");
  });
}

export function subscribeToTickets(onUpdate: (tickets: ConciergeTicket[]) => void) {
  if (!firebaseAvailable) return () => {};
  const ref = collection(db, "tickets");
  return onSnapshot(ref, (snap) => {
    const result: ConciergeTicket[] = [];
    snap.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() } as ConciergeTicket);
    });
    onUpdate(result);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, "tickets");
  });
}

export function subscribeToLegal(onUpdate: (legal: LegalTermVersion[]) => void) {
  if (!firebaseAvailable) return () => {};
  const ref = collection(db, "legal");
  return onSnapshot(ref, (snap) => {
    const result: LegalTermVersion[] = [];
    snap.forEach((doc) => {
      result.push({ ...doc.data() } as LegalTermVersion);
    });
    // Sort by version descending roughly
    result.sort((a,b) => b.version.localeCompare(a.version));
    onUpdate(result);
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, "legal");
  });
}

// Property Operations
export async function addPropertyToDb(property: Omit<Property, "id">) {
  const path = "properties";
  try {
    if (!firebaseAvailable) {
      console.log("[Mock] Property Added:", property);
      return { id: `mock-prop-${Date.now()}`, ...property } as Property;
    }
    const docRef = await addDoc(collection(db, "properties"), property);
    // update self-referential id field
    await updateDoc(docRef, { id: docRef.id });
    return { id: docRef.id, ...property } as Property;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updatePropertyPriceInDb(propertyId: string, customPrice: number) {
  const path = `properties/${propertyId}`;
  try {
    if (!firebaseAvailable) return;
    const ref = doc(db, "properties", propertyId);
    await updateDoc(ref, {
      pricePerNightUSD: customPrice,
      pricePerNightUSDT: customPrice - 2,
      pricePerNightPIX: Math.round(customPrice * 5.2)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Booking Operations
export async function addBookingToDb(booking: Booking) {
  const path = `bookings/${booking.id}`;
  try {
    if (!firebaseAvailable) {
      console.log("[Mock] Booking added:", booking);
      return;
    }
    const ref = doc(db, "bookings", booking.id);
    await setDoc(ref, booking);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateBookingStatusInDb(bookingId: string, paymentStatus: string, escrowStatus: string) {
  const path = `bookings/${bookingId}`;
  try {
    if (!firebaseAvailable) return;
    const ref = doc(db, "bookings", bookingId);
    await updateDoc(ref, { paymentStatus, escrowStatus });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateBookingDisputeInDb(bookingId: string, hasActiveDispute: boolean, disputeNotes: string, paymentStatus: string, escrowStatus: string) {
  const path = `bookings/${bookingId}`;
  try {
    if (!firebaseAvailable) return;
    const ref = doc(db, "bookings", bookingId);
    await updateDoc(ref, { hasActiveDispute, disputeNotes, paymentStatus, escrowStatus });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Ticket Operations
export async function addTicketToDb(ticket: ConciergeTicket) {
  const path = `tickets/${ticket.id}`;
  try {
    if (!firebaseAvailable) return;
    const ref = doc(db, "tickets", ticket.id);
    await setDoc(ref, ticket);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateTicketStatusInDb(ticketId: string, status: "Open" | "Assigned" | "Resolved", description?: string) {
  const path = `tickets/${ticketId}`;
  try {
    if (!firebaseAvailable) return;
    const ref = doc(db, "tickets", ticketId);
    const payload: any = { status };
    if (description) payload.description = description;
    await updateDoc(ref, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Legal version Operations
export async function addLegalVersionToDb(legal: LegalTermVersion) {
  const path = `legal/${legal.version}`;
  try {
    if (!firebaseAvailable) return;
    const ref = doc(db, "legal", legal.version);
    await setDoc(ref, legal);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function archiveOldLegalVersionsInDb() {
  if (!firebaseAvailable) return;
  try {
    const listSnap = await getDocs(collection(db, "legal"));
    for (const d of listSnap.docs) {
      if (d.data().status === "Active") {
        await updateDoc(doc(db, "legal", d.id), { status: "Archived" });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "legal");
  }
}

// Email transactional simulation API proxy
export async function triggerEmailNotification(to: string, subject: string, body: string) {
  try {
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body })
    });
    const parsed = await res.json();
    return parsed;
  } catch (e) {
    console.error("Failed to post email transactional template to Express server log:", e);
  }
}
