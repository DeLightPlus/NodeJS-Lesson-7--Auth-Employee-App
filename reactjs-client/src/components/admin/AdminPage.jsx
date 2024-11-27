import { useEffect, useState } from "react";
import AddEmployee from "../employees/AddEmployee";
import EmployeeList from "../employees/EmployeeList";
import { auth } from "../../firebase/config";
import axios from "axios";

const AdminPage = () => {

    const [employees, setEmployees] = useState([]);

      // Only call get_users once when the component mounts
    useEffect(() => {
        get_users();
    }, []);  // Empty dependency array to prevent infinite loop
    
    const get_users = async () => 
    {
        const user = auth.currentUser;         
        try 
        {
            if (user) 
            {
                const idToken = await user.getIdToken();
                const response = await axios.get("http://localhost:8000/api/employees", {
                    headers: {
                        Authorization: `Bearer ${idToken}`,  // Send token in the Authorization header
                    }
                    });

                console.log('res.data | employees: ', response);
                    
                const data = response.data;
                setEmployees(data);
            }

        }
        catch (error) 
        {
            console.error("Error fetching employees:", error);
        }
    };
    
    return ( 
        <div className="Employees">           
                
            <AddEmployee employees={employees} get_users={get_users} />
            <EmployeeList employees={employees} get_users={get_users} />        
        
            <button onClick={()=>{ get_users();  }}>🔄</button>
        </div>
    );
}
 
export default AdminPage;