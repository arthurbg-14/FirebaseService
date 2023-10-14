import { getStorage, ref, UploadTaskSnapshot } from '@angular/fire/storage';
import { Injectable, inject } from '@angular/core';
import { Firestore, doc,
  collection, query, DocumentReference, QuerySnapshot,
  setDoc, orderBy, getDocs,
  deleteDoc, updateDoc , addDoc, DocumentData,
  docSnapshots, DocumentSnapshot, collectionSnapshots,
  QueryDocumentSnapshot, QueryCompositeFilterConstraint, QueryNonFilterConstraint,
  CollectionReference,
  where,
  writeBatch

} from '@angular/fire/firestore';
import { Observable, firstValueFrom, lastValueFrom } from 'rxjs';
import { getDownloadURL, uploadBytesResumable } from 'rxfire/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore = inject(Firestore)
  private storage = getStorage()

  async addDoc(path: string, item: DocumentData): Promise<DocumentReference<DocumentData>>{
    const colRef = collection(this.firestore, path)
    return addDoc(colRef, item)
  }

  addFile(file: File): [Promise<string>, Observable<UploadTaskSnapshot>] {
    const storageRef = ref(this.storage, file.name)

    const uploadTask = uploadBytesResumable(storageRef, file)

    return [lastValueFrom(uploadTask).then((snapshot) => firstValueFrom(getDownloadURL(snapshot.ref))), uploadTask]
  }
  
  async getColectionPromise<T>(path: string): Promise<QuerySnapshot<T>>{
    const colRef = collection(this.firestore, path) as CollectionReference<T>
    return getDocs<T>(colRef)
  }

  getColection<T>(path: string, field: string, order: 'asc' | 'desc'='asc', ...pathSegments: string[]): Observable<QueryDocumentSnapshot<T>[]>{
    const colRef = collection(this.firestore, path, ...pathSegments) as CollectionReference<T>
    const queryData = query<T>(colRef, orderBy(field, order))
    return collectionSnapshots<T>(queryData)
  }

  async removeDoc(path: string, key: string): Promise<void> {
    const documento = doc(this.firestore, path, key);
    return deleteDoc(documento)
  }

  query<T extends { [x: string]: any }>(path: string, compositeFilter: QueryCompositeFilterConstraint, ...queryConstraints: QueryNonFilterConstraint[]): Observable<QueryDocumentSnapshot<T>[]>{
    const colRef = collection(this.firestore, path) as CollectionReference<T>
    const queryData = query<T>(colRef, compositeFilter, ...queryConstraints)
    return collectionSnapshots<T>(queryData)
  }

  async updateDoc<T extends { [x: string]: any }>(path: string, key: string, data: T): Promise<void> {
    const colecao = doc(this.firestore, path, key)
    return updateDoc(colecao, data)
  }

  getDoc<T>(path: string, ...pathSegments: string[]): Observable<DocumentSnapshot<T>> {
    const docRef = doc(this.firestore, path, ...pathSegments) as DocumentReference<T>
    return docSnapshots<T>(docRef)
  }

  async setDoc<T extends { [x: string]: any }>(path: string, id: string, documento: T): Promise<void> {
    const docRef = doc(this.firestore, path, id)

    return setDoc(docRef, documento)
  }

  getWithField<T>(path: string, fields: [[keyof T & string, any]]) {
    const colRef = collection(this.firestore, path) as CollectionReference<T>
    const compositeFilter = fields.map(([key, value]) => {
      return where(key, "==", value)
    })
    const queryData = query<T>(colRef, ...compositeFilter)
    return collectionSnapshots<T>(queryData)
  }

  getByFieldContain<T>(path: string, fields: [[keyof T & string, any]]) {
    const colRef = collection(this.firestore, path) as CollectionReference<T>
    const compositeFilter = fields.map(([key, value]) => {
      return where(key, "array-contains", value)
    })
    const queryData = query<T>(colRef, ...compositeFilter)
    return collectionSnapshots<T>(queryData)
  }
  
  async changeMultipleDocs(path: string, field: string, docs: string[], value: string): Promise<void> {
    const batch = writeBatch(this.firestore)

    for (const document of docs) {
      const documentoRef = doc(this.firestore, path, document)
      const obj: {[key: string]: string} = {}
      obj[field] = value
      batch.update(documentoRef, obj)
    }

    return batch.commit()
  }
}
