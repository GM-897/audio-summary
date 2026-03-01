import React, {createContext, useState, useEffect, Children} from "react";
import  {getTokens, logout} from '../services/auth';

// Create context -->creates a global auth container;

//AuthContext --> to read auth state and actions
export const AuthContext = createContext();

//  AuthProvider: it supplies auth state to any descendant that consumes the context.
export const AuthProvider = ({ children}) => {
    const [user,setUser] = useState(!!getTokens());

    useEffect(() => {
        setUser(!!getTokens());
    },[]);

    const signOut = () => {
        logout(); setUser(false);
    }


    return (
        <AuthContext.Provider value = {{user, setUser, signOut}}>
            {children}
        </AuthContext.Provider>
    );
};