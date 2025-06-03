import {
    createContext,
    useState,
    useEffect
} from "react";

type AuthUser = {
    ID:         string | null;
    FirstName:  string | null;
    LastName:   string | null;
    Email:      string | null;
};

export type UserContextType = {
    user:       AuthUser | null;
    setUser:    React.Dispatch <React.SetStateAction <AuthUser | null>>;
    unsetUser:  () => void;
};

type UserContextProviderType = {
    children:   React.ReactNode;
};

export const UserContext = createContext ({} as UserContextType);
export const UserContextProvider = ({ children }: UserContextProviderType) =>
{
    const [user, setUser] = useState <AuthUser | null> (null);
    const [isLoading, setIsLoading] = useState <boolean> (true);
    const unsetUser = () => {
        localStorage.clear ();
        setUser (null);
    };

    useEffect (() => {
        const token = localStorage.getItem ("token");

        if (token)
        {
            fetch (`${import.meta.env.VITE_REACT_API_URL}/users/userDetails`,
            {
                headers: { Authorization: `Bearer ${token}`, },
            })
                .then ((res) => res.json())
                .then ((data) => {
                    if (data && typeof data.ID !== "undefined")
                    {
                        setUser (
                        {
                            ID:         data.ID,
                            FirstName:  data.FirstName,
                            LastName:   data.LastName,
                            Email:      data.Email,
                        });
                    }
                    else
                    {
                        setUser (
                        {
                            ID:         null,
                            FirstName:  null,
                            LastName:   null,
                            Email:      null,
                        });
                    }

                    setIsLoading (false);
                })
            
                .catch ((err) => {
                    console.error ("Error fetching user details: ", err)
                });
        }
        else
        { setIsLoading (false); }
    }, []);

    return (
        <UserContext.Provider value = {{ user, setUser, unsetUser }}>
            {
                isLoading
                    ? ( <div>Loading...</div> )
                    : ( children )
            }
        </UserContext.Provider>
    );
};