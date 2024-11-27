// EmployeeList.js
import React from 'react';
import EmployeeCard from './EmployeeCard';

const EmployeeList = ({ employees, get_users }) => {

    
  return (
    <div className="employee_list">
      { employees &&
        employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))
      }
    </div>
  );
};

export default EmployeeList;

{/* <div className="">
                {employees.length === 0 ? (
                    <div>Loading...</div>
                ) : (
                    employees.map((employee) => (
                        <div key={employee.id} className="">
                            <div className=""></div>
                            <img src={employee.image} alt="image" className="" />
                            <h1 className="">{employee.name}</h1>
                            <h1 className="">{employee.phoneNumber}</h1>
                            <h1 className="">{employee.email}</h1>
                            <h1 className="">{employee.ID}</h1>
                            <h1 className="">{employee.position}</h1>
                            
                            <button className=""
                                onClick={() => {
                                    setEditingEmployee(employee);
                                    setEditModalOpen(true);
                                }}
                            ><RiEdit2Line /></button>

                            <button className="shadow-sm font-bold py-2 px-4 rounded"
                                onClick={async () => {
                                    try {
                                        await axios.delete(`http://localhost:8080/registrations/${employee.id}`);
                                        console.log("deleted");
                                        window.location.reload();
                                    } catch (error) {
                                        console.error("Error deleting employee:", error);
                                    }
                                }}
                            ><RiDeleteBin2Line /></button>
                
                            {
                                editModalOpen && 
                                editingEmployee.id === employee.id && 
                                (
                                    <div className="modal">
                                        <div className="modal-content">
                                            <h2>Edit Employee</h2>
                                            <form>
                                                <label>
                                                    Name:
                                                    <input
                                                        type="text"
                                                        value={editingEmployee.name}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                                                    />
                                                </label>
                                                <label>
                                                    Email Address:
                                                    <input
                                                        type="text"
                                                        value={editingEmployee.emailAddress}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, emailAddress: e.target.value })}
                                                    />
                                                </label>
                                                <label>
                                                    Phone Number:
                                                    <input
                                                        type="text"
                                                        value={editingEmployee.phoneNumber}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, phoneNumber: e.target.value })}
                                                    />
                                                </label>
                                                <label>
                                                    Position:
                                                    <input
                                                        type="text"
                                                        value={editingEmployee.position}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                                                    />
                                                </label>
                                                                                        <label>
                                                    ID:
                                                    <input
                                                        type="text"
                                                        value={editingEmployee.ID}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, ID: e.target.value })}
                                                    />
                                                </label>
                                                <label>
                                                    Image:
                                                    <input
                                                        type="text"
                                                        value={editingEmployee.image}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, image: e.target.value })}
                                                    />
                                                </label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        editEmployee(editingEmployee.id, editingEmployee);
                                                        setEditModalOpen(false); 
                                                    }}>
                                                    Save Changes
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setEditModalOpen(false)}>
                                                    Cancel
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    ))
                )}
            </div>

            <div>
                {submittedData !== null && (
                    <table className="">
                        <tbody>
                            <tr key="name" className="">
                                <th className="">Name</th>
                                <td className="">{submittedData.name}</td>
                            </tr>
                            <tr key="email">
                                <th className="">Email</th>
                                <td className="">{submittedData.emailAddress}</td>
                            </tr>
                            <tr key="image">
                                <th className="">Image</th>
                                <td className="">
                                    <img
                                        src={submittedData.image}
                                        alt=""
                                        style={{ height: "150px", objectFit: "cover", borderRadius: "10px" }}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div> */}