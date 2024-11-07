const { collection, getDocs, doc,
    getDoc, addDoc, deleteDoc, setDoc
} = require('firebase/firestore');
const { ref, uploadBytes, getDownloadURL, getStorage } = require('firebase/storage');
const { db, firebase_storage} = require('../firebase/config');

const getEmployees = async (req, res) => {
    try {
        const employeesCollection = collection(db, 'employees');
        const employeeSnapshot = await getDocs(employeesCollection);
        const employees = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(employees);
    }
    catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).send({ message: 'Error fetching employees', error });
    }
}

const getEmployeeById = async (req, res) => {
    const id = req.params.id;

    try {
        const employeeDoc = doc(db, 'employees', id);
        const employeeSnapshot = await getDoc(employeeDoc);

        if (employeeSnapshot.exists()) {
            res.json({ id: employeeSnapshot.id, ...employeeSnapshot.data() });
        }
        else {
            res.status(404).send({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error("Error fetching employee:", error);
        res.status(500).send({ message: 'Error fetching employee', error });
    }
}


const addEmployee = async (req, res) => {
   
    // console.log(photo, ' vs ', image);
    // const imageUrl = await uploadImage(image, employeeId);

    // if (!employeeId || !name || !email || !phone || !position || !imageUrl) {
    //     return res.status(400).json({ error: 'Missing required fields' });
    // }

    try {

        const { employeeId, name, email, phone, position} = req.body;
        const photo = req.file;

        const storage = getStorage();

        const fileRef = ref(storage, `files/${employeeId}`);
        await uploadBytes(fileRef, photo.buffer );
        const imageUrl = await getDownloadURL(fileRef);

         const newEmployee = { employeeId, name, email, phone, position, imageUrl };
        const docRef = await addDoc(collection(db, 'employees'), newEmployee);
        res.status(201).json({ id: docRef.id, ...newEmployee });
        // console.log(url)
    }
    catch (error) {
        console.error("Error adding employee:", error);
        res.status(500).send({ message: 'Error adding employee', error });
    }
}

const deleteEmployeeById = async (req, res) => {
    const id = req.params.id;

    try {
        const employeeDoc = doc(db, 'employees', id);
        await deleteDoc(employeeDoc);
        res.status(200).send({ message: 'Employee deleted successfully' });
    }
    catch (error) {
        console.error("Error deleting employee:", error);
        res.status(500).send({ message: 'Error deleting employee', error });
    }
}

const updateEmployeeById = async (req, res) => {
    const id = req.params.id;
    const { name, email, phone, position, image } = req.body;
    const photo = req.file;
    console.log(photo, ' vs ', image);
    

    try 
    {
        const employeeDoc = doc(db, 'employees', id);
        await setDoc(employeeDoc, { name, email, phone, position, image }, { merge: true });
        res.status(200).send({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error("Error updating employee:", error);
        res.status(500).send({ message: 'Error updating employee', error });
    }
}

module.exports = { getEmployees, getEmployeeById, addEmployee, deleteEmployeeById, updateEmployeeById }