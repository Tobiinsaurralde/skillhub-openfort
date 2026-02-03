import React from 'react';

const AppDebug = () => {
    return (
        <div style={{ padding: 50, background: 'lightblue', height: '100vh', color: 'black' }}>
            <h1>DEBUG MODE</h1>
            <p>If you see this, main.tsx is working and the issue is in App.tsx</p>
        </div>
    );
};

export default AppDebug;
