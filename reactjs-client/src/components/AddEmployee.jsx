import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeCard from "./EmployeeCard";

function AddEmployee() {
    const [employeeId, setEmployeeId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmailAddress] = useState("");
    const [phone, setPhoneNumber] = useState("");

    const [img_url, setImageUrl] = useState("");
    const [image, setImage] = useState("");

    const [position, setPosition] = useState("");
    const [submittedData, setSubmittedData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [errors, setErrors] = useState({});

    const handleSubmits = async (e) => {
        e.preventDefault();

        const employee = { employeeId, name, email, phone, position, image };
        
        try {
            
            const response = await axios.post("http://localhost:8000/api/employees", employee , 
                {
                    headers: { "Content-Type": "multipart/form-data", }
            }); 
            
            const data = response.data;
            setSubmittedData(employee);
            clearForm();
        } catch (error) {
            console.error("Error adding employee:", error);
        }
    };

    

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
            setImageUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const validateInputs = (employee) => {
        const errors = {};
        if (!employee.employeeId) errors.employeeId = "ID is required.";
        if (!employee.name) errors.name = "Name is required.";
        if (!employee.email) errors.email = "Email is required.";
        if (!/\S+@\S+\.\S+/.test(employee.email)) errors.email = "Email is invalid.";
        if (!employee.phone) errors.phone = "Phone number is required.";
        if (!employee.position) errors.position = "Position is required.";
        return errors;
    };

    const clearForm = () => {
        setName("");
        setEmailAddress("");
        setPhoneNumber("");
        setImage("");
        setPosition("");
        setEmployeeId("");
        setErrors({});
    };

    const get_users = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/employees");
            const data = response.data;
            setEmployees(data);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    // Only call get_users once when the component mounts
    useEffect(() => {
        get_users();
    }, []);  // Empty dependency array to prevent infinite loop

    return (
        <div className="Employees">
            <div className="AddEmployees">
                <EmployeeCard employee={{ employeeId, name, email, phone, position, img_url }} />
                <div className="form-container">
                    <h2>Add Employee</h2><hr/>
                    {/* {console.log(image,' vs url:', img_url) } */}
                    <form onSubmit={handleSubmits}>
                        <label>
                            ID:
                            <input
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                            />
                            {errors.employeeId && <span className="text-red-500">{errors.employeeId}</span>}
                        </label>
                        
                        <label>
                            Enter your name:
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {errors.name && <span>{errors.name}</span>}
                        </label>

                        <label>
                            Email address:
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmailAddress(e.target.value)}
                            />
                            {errors.email && <span>{errors.email}</span>}
                        </label>

                        <label>
                            Phone number:
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            {errors.phone && <span>{errors.phone }</span>}
                        </label>

                        <label className="image_preview">                        
                            {
                                img_url && (
                                    <div>
                                        <h3>Preview:</h3>
                                        <img src={img_url} alt="Preview" style={{ height:"64px", width:"64px",  objectFit: "cover" }} />
                                    </div>
                                )
                            }
                            <div>Image: 
                            <input
                                type="file"
                                onChange={handleImageChange}
                            /></div>
                            
                        </label>

                        <label>
                            Employee position:
                            <input
                                type="text"
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                            />
                            {errors.position && <span>{errors.position}</span>}
                        </label>                    

                        <button className="addemployee_btn" type="submit">
                            Submit
                        </button>

                        {/* <img src="https://firebasestorage.googleapis.com/v0/b/restlebnb-hotel-app.appspot.com/o/files%2F20201030SD96?alt=media&token=1919ce4e-e5fb-4a12-b29f-32788dc94a0e"/> */}
                    </form>
                </div>            
            </div>
        </div>
    );
}

export default AddEmployee;