import React, { useState } from 'react';
import './Header.css'; // Import your CSS file
import { Link } from 'react-router-dom';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    const inputHandler = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        const filtered = data.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.emailadress.toLowerCase().includes(query) ||
            item.phonenumber.includes(query) || 
            item.ID.toString().includes(query)
        );
        setFilteredData(filtered);
    };

    return (
        <header className="header">
            <div className="container">
                <nav className="navbar">
                    <div className="logo">
                        {/* <a href="#" title="">
                            <img src="https://cdn.rareblocks.xyz/collection/celebration/images/logo.svg" alt="Logo" />
                        </a> */}
                        Employee App
                    </div>                   

                    {/* <div className="nav-links">
                        <a href="#" className="nav-link">
                            <input
                                type="text"
                                onChange={inputHandler}
                                placeholder='Search'
                                value={searchQuery}
                            />
                        </a>                        
                    </div> */}

                    <div className="auth-links">
                        {/* <a href="#" className="nav-link">Sign up</a>
                        <a href="#" className="nav-link">Sign in</a> */}
                        <Link className='nav-link' to="/login">Signin</Link>
                        {/* <Link className='nav-link' to="/signup">signup</Link> */}
                        <Link className='nav-link' to="/logout">Logout</Link>
                    </div>
                </nav>                
            </div>
        </header>
    );
};

export default Header;
