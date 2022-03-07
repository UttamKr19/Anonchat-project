import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient =null;
const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState(new Map());     
    const [publicChats, setPublicChats] = useState([]); 
    const [tab,setTab] =useState("CHATROOM");
    const [connectButton,setConnectButton] =useState({
        text:"connect",
        enabled:true,
    });
    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
      });
      
    useEffect(() => {
    //   console.log(userData);
    }, [userData]);

    const connect =()=>{
        let socketServers = ['http://localhost:8080/ws','https://anonchat-server.herokuapp.com/ws','https://anonchat-server2.herokuapp.com/ws']
        setConnectButton({text:"connecting...", enabled:false})
        let socket = new SockJS(socketServers[0]);
        stompClient = over(socket);
        stompClient.connect({},onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});
        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/'+userData.username+'/private-message', onPrivateMessage);
        userJoin();
    }

    const userJoin=()=>{
          var chatMessage = {
            senderName: userData.username,
            status:"JOIN"
          };
          stompClient.send("/app/public-message", {}, JSON.stringify(chatMessage));
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
        // console.log(payload);
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
        // swal.fire("Error!", "Error while connecting!", "error");
        
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
            if(chatMessage.message.length>0){
                // console.log(chatMessage);
                stompClient.send("/app/public-message", {}, JSON.stringify(chatMessage));
                setUserData({...userData,"message": ""});
            }
            
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
          
            if(chatMessage.message.length>0){
            //if sending msg to someone for the first time, put the msg in map ( map<friend,chats>)
                if(userData.username !== tab){
                    privateChats.get(tab).push(chatMessage);
                    setPrivateChats(new Map(privateChats));
                }
                stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
                setUserData({...userData,"message": ""});
            }
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
    <div>
        {userData.connected?

            <div class="row no-gutters">
                <div class="col-lg-2">
                    <div className="members">
                            <ul>
                                <li><div className="logo-secondary"><b>AnonChat</b></div></li>
                                <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}><b>Public Room</b></li>
                                {[...privateChats.keys()].map((name,index)=>(
                                    <li onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>{name}</li>
                                ))}
                            </ul>
                        </div>
                </div>
                
                <div className="chatroom-message-box col-lg-10">
                    <br/>
                    {/* public chat room */}
                    {tab==="CHATROOM" && 
                    <div class="public-chat-view justify-content-md-center">
                        <div className="d-flex justify-content-center" style={{color:"white", textShadow: "3px 3px 3px rgb(78, 207, 106)"}}>
                            <h5>Public Chat Room</h5>
                        </div>
                        <div className="public-chat-content">
                            <ul className="public-chat-messages">
                                    {publicChats.map((chat,index)=>(
                                        <div className="chat-message-sendername">
                                            <span className={`message ${chat.senderName === userData.username && "self"}`} >
                                                {chat.senderName !== userData.username &&
                                                    <div className="avatar">
                                                        <b>[</b> <i>{chat.senderName}</i> <b>]</b>
                                                    </div>
                                                }
                                                {chat.senderName === userData.username &&
                                                    <div className="avatar self">
                                                    <b>[</b>You<b>]</b>
                                                    </div>
                                                }
                                            </span>
                                            <li className={`message ${chat.senderName === userData.username && "self"}`}>
                                                {<div className="message-data">{chat.message}</div>}
                                            </li>
                                        </div>
                                    ))}
                            </ul>
                        </div>
                        <br/><br/>
                        <div className="send-message-form" > 
                            <form onSubmit={sendValue}>
                                <div className="send-message-box row no-gutters">
                                    <div class="input-group mb-3">
                                        <input type="text" 
                                            className="form-control input-message" 
                                            autoFocus 
                                            placeholder="Type message..." 
                                            value={userData.message} 
                                            onChange={handleMessage} />

                                        <div class="input-group-append">
                                            <button type="submit" 
                                                    className="send-button" 
                                                    onClick={sendValue}>
                                                <i className="fa fa-paper-plane" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>}
                    

                    {/* private chat */}
                    {tab!=="CHATROOM" && 
                    <div class="private-chat-view justify-content-md-center">
                        <div className="d-flex justify-content-center" style={{color:"white", textShadow: "3px 3px 3px rgb(228, 89, 25)"}}>
                            <h5>Private Chat <b>[</b> <i>{tab}</i> <b>]</b></h5>
                        </div>
                        
                        <div className="private-chat-content">
                            <ul className="private-chat-messages">
                                    {[...privateChats.get(tab)].map((chat,index)=>(
                                        <div className="chat-message-sendername">
                                            <span className={`message ${chat.senderName === userData.username && "self"}`} >
                                                {chat.senderName !== userData.username &&
                                                    <div className="avatar">
                                                        <b>[</b> <i>{chat.senderName}</i> <b>]</b>
                                                    </div>
                                                }
                                                {chat.senderName === userData.username &&
                                                    <div className="avatar self">
                                                    <b>[</b>You<b>]</b>
                                                    </div>
                                                }
                                            </span>
                                            <li className={`message ${chat.senderName === userData.username && "self"}`}>
                                                {<div className="message-data">{chat.message}</div>}
                                            </li>
                                        </div>
                                    ))}
                            </ul>
                        </div>
                        <br/><br/>
                        <div className="send-message-form" > 
                            <form onSubmit={sendPrivateValue}>
                                <div className="send-message-box row no-gutters">
                                    <div class="input-group mb-3">
                                        <input type="text" 
                                            className="form-control input-message" 
                                            autoFocus 
                                            placeholder="Type message..." 
                                            value={userData.message} 
                                            onChange={handleMessage} />

                                        <div class="input-group-append">
                                            <button type="submit" 
                                                    className="send-button" 
                                                    onClick={sendPrivateValue}>
                                                <i className="fa fa-paper-plane" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>}
                </div>
            </div>
        
        :
        <div>
            <div style={{fontSize:"12px", float:"right", top:"0px",color:"white"}}>
                <i>Note: Server Slow! Try refreshing if not connected on first try </i>
                <span
                        class="btn-sm btn-dark" 
                        data-toggle="tooltip" 
                        data-placement="bottom" 
                        title="The app is deployed on free heroku server, the app goes into sleep mode when no one is using it and it takes few minutes to wake up.">
                        why?
                </span>
            </div>

            <div className="container h-100 d-flex justify-content-center">
                <div className="jumbotron my-auto">
                    <div className="welcome-box">
                        <h1 className="display-5"> Welcome to <span className="logo-primary"><b>AnonChat</b></span></h1>
                        <hr/>
                    </div>
                    <div className="d-flex justify-content-center">
                        <img style={{width:"300px",height:"auto",}} src="front-image.png" alt=""></img>
                    </div>
                    <br/>
                    <div className="d-flex justify-content-center">
                        <form onSubmit={registerUser} className="form-group">
                            <input
                                autoFocus
                                required
                                className="register-input form-control"
                                id="user-name"
                                placeholder="Enter nickname"
                                name="userName"
                                value={userData.username}
                                onChange={handleUsername}
                            />
                            <div>
                                <button className="register-button" type="submit" disabled={!connectButton.enabled}>
                                        {connectButton.text} 
                                </button> 
                            </div>
                        </form>
                    </div>

                    <div className="d-flex justify-content-center fixed-bottom developedBy">
                        <i> &copy; (2022) &lt; Developer :  <b> Uttam Kumar</b> / &gt; </i>
                    </div>

                </div>
            </div>
        </div>
        }
    </div>
    )
}

export default ChatRoom
