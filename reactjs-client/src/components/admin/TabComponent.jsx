import React, { useState } from 'react';
import './admin.css'; // Import the CSS file for styling

const TabComponent = ({setCurTab}) => {
  const [activeTab, setActiveTab] = useState('Admins');
  const content = {
    Admins: "Content for Photos tab.",
    Employees: "Content for Music tab.",
    OtherUsers: "Content for Videos tab."
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="tab-container">
      {/* Tab Buttons */}
      <div className="tab-buttons">
        {['Admins', 'Employees', 'OtherUsers'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active-tab' : ''}`}
            onClick={() => {
              handleTabClick(tab)
              setCurTab(tab);
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
    </div>
  );
};

export default TabComponent;
