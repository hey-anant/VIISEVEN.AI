import React,{ createContext, useState,useEffect } from 'react'


export const UserDetailContext = createContext()

export const UserDetailProvider=({children})=>{
    const [userDetail, setUserDetail] = useState()
    const [loading, setLoading] = useState(true) 
    useEffect(() => {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUserDetail(JSON.parse(storedUser));
            } catch (error) {
              console.error('Error parsing stored user:', error);
            }
          }
        }
        setLoading(false)
      }, []);
      
    return(
        <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
            {children}
        </UserDetailContext.Provider>
    )
}