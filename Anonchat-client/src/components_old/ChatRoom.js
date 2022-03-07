import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient =null;
const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     
    const [publicChats, setPublicChats] = useState([]); 
    const [tab,setTab] =useState("CHATROOM");
    const [connectButtonText,setConnectButtonText] =useState("connect");
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
      });
      
    useEffect(() => {
      console.log(userData);
    }, [userData]);

    const connect =()=>{
        // let socketServerLocal='http://localhost:8080/ws'
        // let socketServerCloud2='https://anonchat-server.herokuapp.com/ws'
        setConnectButtonText("connecting...")
        let socketServerCloud='https://anonchat-server.herokuapp.com/ws'
        let socket = new SockJS(socketServerCloud);
        stompClient = over(socket);
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessage);
        userJoin();
    }

    const userJoin=()=>{
          var chatMessage = {
            senderName: userData.username,
            status:"JOIN"
          };
          stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    }

    //PUBLIC messages
    // if someone joins, check if user is old or new
    // if new, then map the sender name with empty msg
    // if it's not a new joinee, then just add the msg to existing public msgs
    const onMessageReceived = (payload)=>{
        var payloadData = JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
            default:
                break;
        }
    }
    
    // PRIVATE messages
    // if sender name is already in map, just push the new message into existing message list
    // else add the brand new msg to a list and map the sender name with that list
    const onPrivateMessage = (payload)=>{
        console.log(payload);
        var payloadData = JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list =[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
    }

    const onError = (err) => {
        console.log(err);
    }

    const handleMessage =(event)=>{
        const {value}=event.target;
        setUserData({...userData,"message": value});
    }

    const sendValue=(e)=>{
        e.preventDefault();
        if (stompClient) {
            var chatMessage = {
            senderName: userData.username,
            message: userData.message,
            status:"MESSAGE"
            };
            console.log(chatMessage);
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
            setUserData({...userData,"message": ""});
        }
    }

    const sendPrivateValue=(e)=>{
        e.preventDefault();
        if (stompClient) {
          var chatMessage = {
            senderName: userData.username,
            receiverName:tab,
            message: userData.message,
            status:"MESSAGE"
          };
          
          //if sending msg to someone for the first time, put the msg in map ( map<friend,chats>)
          if(userData.username !== tab){
            privateChats.get(tab).push(chatMessage);
            setPrivateChats(new Map(privateChats));
          }
          stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
          setUserData({...userData,"message": ""});
        }
    }

    const handleUsername=(event)=>{
        const {value}=event.target;
        setUserData({...userData,"username": value});
    }

    const registerUser=(e)=>{
        e.preventDefault();
        connect();
    }


    return (
    <div className="container">
        
        {userData.connected?
        <div className="chat-box">
            <div className="member-list">
                
                <ul>
                    <li><div className="logo"><b>AnonChat</b></div></li>
                    <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}><b>Public Room</b></li>
                    {[...privateChats.keys()].map((name,index)=>(
                        <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>{name}</li>
                    ))}
                </ul>
            </div>
            {tab==="CHATROOM" && 
            <div className="chat-content">
                
                <ul className="chat-messages">
                    {publicChats.map((chat,index)=>(
                        <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                            {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                            <br/><div className="message-data">{chat.message}</div>
                            {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                        </li>
                    ))}
                </ul>
                <form onSubmit={sendValue}>
                    <div className="send-message">
                        <input type="text" className="input-message" autoFocus placeholder="Type message..." value={userData.message} onChange={handleMessage} /> 
                        <button type="submit" className="send-button" onClick={sendValue}>send</button>
                    </div>
                </form>
            </div>}
            {tab!=="CHATROOM" && 
            <div className="chat-content">
                
                <ul className="chat-messages">
                    {[...privateChats.get(tab)].map((chat,index)=>(
                        <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                            {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                            <div className="message-data">{chat.message}</div>
                            {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                        </li>
                    ))}
                </ul>
                <form onSubmit={sendPrivateValue}>
                    <div className="send-message">
                        <input type="text" autoFocus className="input-message" placeholder="Type message..." value={userData.message} onChange={handleMessage} /> 
                        <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                    </div>
                </form>
            </div>}
        </div>
        :
        <div>
            <div style={{fontSize:"12px", float:"right", top:"0px",color:"white"}}>
                <i>Might be slow for first time access</i>
                <br></br>
                <i>Stay patient :)</i>
            </div>
        
            <div className="register">
                <form onSubmit={registerUser}>
                    <div className="welcome-box">
                            Welcome to <span className="logo"><b>AnonChat</b></span>
                            <br></br>
                            <div style={{fontSize:"16px"}}>(an anonymous chatting application)</div>
                    </div>
                    
                    <input
                        autoFocus
                        required
                        className="register-input"
                        id="user-name"
                        placeholder="Enter nickname"
                        name="userName"
                        value={userData.username}
                        onChange={handleUsername}
                        margin="normal"
                    />
                    <br></br>
                    <div>
                        <button type="submit">
                                {connectButtonText}
                        </button> 
                    </div>
                   
                </form>
            </div>
            <div className="front-image">
                    <img style={{width:"300px",height:"auto",}} src="front-image.png" alt=""></img>
            </div>
            <div>
                <div className="developedBy">
                   <i> &copy; (2022) &lt; Developer :  <b> Uttam Kumar</b> / &gt; </i>
                </div>
            </div>
        </div>}
    </div>
    )
}

export default ChatRoom
