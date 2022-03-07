package com.uttam.anonchatserver.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.uttam.anonchatserver.models.Message;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    // app/public-message for public chatroom msg mapping
    @MessageMapping("/public-message")
    @SendTo("/chatroom/public") // whenever user wants to receive a message from public room, they need to listen to this url
    public Message receiveMessage(@Payload Message message){
    	System.out.println(message.toString());
        return message;
    }

    // app/private-message, for private message to user
    @MessageMapping("/private-message")
    public Message recMessage(@Payload Message message){
    	//not using @SendTo a static uri!! So, using SimpMsgTemplate for sending it to unique(dynamic) topic for each user
    	// so basically, creating topic on the fly.. /user/Uttam/private-message
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(),"/private-message",message); 
        System.out.println(message.toString());
        return message;
    }
}