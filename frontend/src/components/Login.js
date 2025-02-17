import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_URL } from "utils/Urls";
import user from "reducers/user";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // responsible for login 
    const [mode, setMode] = useState("login");
    // dispatch to put access token into main component 
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // get accessToken from store
    const accessToken = useSelector(store => store.user.accessToken);
    useEffect(() => {
        if(accessToken) {
            navigate("/")
        }
    }, [accessToken]);
    const onFormSubmit = (event) => {
        // form not to reload page
        event.preventDefault();
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: username, password:password})
        };
        fetch(API_URL(mode), options)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(data)
                    dispatch(user.actions.setAccessToken(data.response.accessToken));
                    dispatch(user.actions.setUsername(data.response.username));
                    dispatch(user.actions.setUserId(data.response.id));
                    dispatch(user.actions.setError(null));
                } else {
                    dispatch(user.actions.setAccessToken(null));
                    dispatch(user.actions.setUsername(null));
                    dispatch(user.actions.setUserId(null));
                    dispatch(user.actions.setError(data.response))                  
                }
            })
    }
return (
    <>
    <label 
      htmlFor="register"> Register </label>
      <input 
      type="radio" 
      id="register" 
      checked={mode === "register"}
      onChange={() => setMode("register")} />
    <label 
      htmlFor="login"> Login </label>
      <input 
      type="radio" 
      id="login" 
      checked={mode === "login"}
      onChange={() => setMode("login")} />
      <form onSubmit={onFormSubmit}>
        <label htmlFor="username"> Username</label>
        <input 
            type="text" 
            id="username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} />
        <label htmlFor="password"> Password </label>
        <input 
            type="password" 
            id="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} />
            <button type="submit">Submit</button>
      </form>
    </>
)
}

export default Login;