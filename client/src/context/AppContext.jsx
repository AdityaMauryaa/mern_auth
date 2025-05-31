import { createContext, useEffect, useState } from "react"
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContent=createContext();
export const AppContextProvider=(props)=>{

    axios.defaults.withCredentials=true

    const backendUrl=import.meta.env.VITE_BACKEND_URL
    const [isLoggedin,setIsLoggedin]=useState(false)
    const [userData,setUserData]=useState(false)


    const getAuthState=async ()=>{
        try {
            const {data}=await axios.get(backendUrl+'/api/auth/is-auth');
            if(data.success){
                setIsLoggedin(true)
                getUserData()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getUserData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/user/data');
    
            if (data.success) {
                setUserData(data.userData);
            } else {
                setUserData(null); 
                setIsLoggedin(false);
                localStorage.removeItem("token"); 
                console.warn("User not found or deleted");
               
            }
    
        } catch (error) {
            if (error.response?.status === 404) {
                console.warn("User not found. Possibly deleted.");
                setUserData(null);
                setIsLoggedin(false);
                localStorage.removeItem("token"); 
            } else {
                toast.error("Error fetching user: " + error.message);
            }
        }
    };
    
    useEffect(()=>{
        getAuthState()
    },[])
    const value={
        backendUrl,
        isLoggedin,setIsLoggedin,
        userData,setUserData,
        getUserData

    }
    return (
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>

    )
}