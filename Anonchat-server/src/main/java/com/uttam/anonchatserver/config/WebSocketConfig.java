package com.uttam.anonchatserver.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) { //starting part for all websocket connection
        // setting the endpoint of the socket
    	registry.addEndpoint("/ws") // serves as starting path for all webSocket connections
        		.setAllowedOriginPatterns("*") // optional, allowing all cross-origin resquests
        		.withSockJS(); // sockJs is...
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
    	
    	// 
        registry.setApplicationDestinationPrefixes("/app");  //to send message   /app/message
        
        // topic prefixes
        registry.enableSimpleBroker("/chatroom","/user");
        
        //
        registry.setUserDestinationPrefix("/user");
    }
}