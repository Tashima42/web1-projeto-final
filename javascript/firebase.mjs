import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-auth.js";
import { getFirestore, getDoc, setDoc, deleteDoc, addDoc, doc, Timestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-firestore.js";
import { getStorage, ref, uploadString } from "https://www.gstatic.com/firebasejs/9.9.4/firebase-storage.js";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const strg = getStorage(app);


export const User = {
  create: async (email, password, birthDate, name, sex) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      const { uid, accessToken } = user
      await setDoc(doc(db, "users", uid), { birthDate: Timestamp.fromDate(birthDate), name, sex, uid })
      return user
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  signIn: async (email, password) => {
    try {
      const { user: { uid, accessToken } } = await signInWithEmailAndPassword(auth, email, password)
      const userSnapShot = await getDoc(doc(db, "users", uid))
      if (!userSnapShot.exists()) throw new Error(`User '${uid}' data not found`)
      const user = userSnapShot.data()
      user.accessToken = accessToken
      user.birthDate = user.birthDate.toDate()
      return user
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export const Vaccine = {
  create: async (date, dose, name, nextDose, proofImage, user) => {
    try {
      const vaccineRef = await addDoc(collection(db, "vaccines"), {
        date: Timestamp.fromDate(date),
        dose,
        name,
        nextDose: Timestamp.fromDate(nextDose),
        proofImage,
        user: doc(db, "users", user)
      })
      return vaccineRef.id
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  update: async (id, date, dose, name, nextDose, proofImage, user) => {
    try {
      await setDoc(doc(db, "vaccines", id), {
        date: Timestamp.fromDate(date),
        dose,
        name,
        nextDose: Timestamp.fromDate(nextDose),
        proofImage,
        user: doc(db, "users", user)
      })
      return
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, "vaccines", id))
      return
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getById: async (id) => {
    try {
      const vaccineSnapShot = await getDoc(doc(db, "vaccines", id))
      if (!vaccineSnapShot.exists()) throw new Error(`Vaccine '${id}' data not found`)
      const vaccine = vaccineSnapShot.data()
      vaccine.date = vaccine.date.toDate()
      vaccine.nextDose = vaccine.nextDose.toDate()
      console.log(vaccine)
      return vaccine
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getByUserId: async (user) => {
    try {
      const vaccines = []
      const q = query(collection(db, "vaccines"), where("user", "==", doc(db, "users", user)));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((vaccine) => {
        const id = vaccine.id
        vaccine = vaccine.data()
        vaccine.id = id
        vaccine.date = vaccine.date.toDate()
        vaccine.nextDose = vaccine.nextDose.toDate()
        vaccines.push(vaccine)
      });
      console.log(vaccines)
      return vaccines
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export const Storage = {
  upload: async (fileName, base64) => {
    try {
      const snapshot = await uploadString(ref(strg, `public/${fileName}`), base64, 'data_url')
      return `https://firebasestorage.googleapis.com/v0/b/projeto-mobile-7af32.appspot.com/o/public%2F${fileName}?alt=media`
    } catch (error) {
      console.error(error)
      throw error
    }
  },
}

  //vaccine.create(new Date(), 1, "first", new Date(), "image", "d6ODlLhlkPt89bYCnTYU")
  //vaccine.getById("ngzPSwD35PvkMSB10sfN")
  //vaccine.getByUserId("d6ODlLhlkPt89bYCnTYU")
  //storage.upload('face4.png', `data:image/png;base64,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`)
  //user.create("pedrotashima42+1@gmail.com", "password", new Date(), "Pedro", "m")
  //user.resetPassword("pedrotashima42+1@gmail.com")
  // user.signIn("pedrotashima42+1@gmail.com", "secret")
