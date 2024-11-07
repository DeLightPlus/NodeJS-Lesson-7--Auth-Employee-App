import React, { useState } from 'react';
import axios from 'axios';

const EmployeeCard = ({ employee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState({
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    image: employee.imageUrl || employee.img_url, // Include image if needed
  });

  const handleEdit = async () => {
    // Basic validation
    if (!editedEmployee.name || !editedEmployee.email || 
      !editedEmployee.phone || !editedEmployee.position) 
    {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await axios.put(`http://localhost:8000/api/employees/${employee.id}`, editedEmployee);
      console.log("Employee updated:", response.data.message);
      setIsModalOpen(false);
      window.location.reload(); // Refresh to see changes
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8000/api/employees/${employee.id}`);
      console.log("deleted");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const onAvatarChange = async (e) => 
  {
    e.preventDefault();
    const file = e.target.files[0];
    console.log('Attempting to update avatar');

    if (file) 
    {
        const formData = new FormData();
        formData.append('image', file); // Append the file to FormData
        formData.append('id', employee.id); // Include the employee ID if needed
        formData.append('employeeId', employee.employeeId);

        try 
        {
            const response = await axios.patch(`/api/employees/${employee.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Handle success
            console.log('Avatar updated successfully:', response.data);
            // Optionally, update the state to reflect the new image
            // setEmployee(response.data); // Uncomment and implement if you maintain employee state
        } 
        catch (error) 
        {
          console.error('Error uploading avatar:', error.response ? error.response.data : error.message);
        }
    }
  }

  return (
    <>
      <div className="employee_card">
        <div className="top">
          {employee.id && console.log(employee.id)}
          <div className='employee_avatar'>
            <img 
              src={employee.imageUrl || employee.img_url} 
              alt="Preview" 
              style={{ height: "128px", width: "128px", objectFit: "cover" }} 
            />
            <input type='file' 
             style={{ width: "128px", height: "32px" }} 
             onChange={(e)=>{ onAvatarChange(e) }}
            />
          </div>

          <div className="employee_details">
            <big>{employee.name}</big><br />
            <strong>{employee.position}</strong>
            <h1>{employee.employeeId}</h1>
            <hr />
            <div>
              <small>{employee.email}</small><br />
              <small>{employee.phone}</small>
            </div>
          </div>
        </div>

        {employee.imageUrl && (
          <div className="button_group">
            <button onClick={() => setIsModalOpen(true)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>

      {/* Modal for editing employee */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            <h2>Edit Employee</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
              <input
                type="text"
                value={editedEmployee.name}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, name: e.target.value })}
                placeholder="Name"
                required
              />
              <input
                type="text"
                value={editedEmployee.position}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, position: e.target.value })}
                placeholder="Position"
                required
              />
              <input
                type="email"
                value={editedEmployee.email}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, email: e.target.value })}
                placeholder="Email"
                required
              />
              <input
                type="text"
                value={editedEmployee.phone}
                onChange={(e) => setEditedEmployee({ ...editedEmployee, phone: e.target.value })}
                placeholder="Phone"
                required
              />
              <button type="submit">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeCard;