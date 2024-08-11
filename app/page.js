'use client'

import { Box, Button, Stack, TextField, Typography, List, ListItem, ListItemText } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ])

  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff') // Default light theme
  const messagesEndRef = useRef(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [recentChats, setRecentChats] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false) // Sidebar toggle state

  useEffect(() => {
    const updateBackgroundColor = () => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      setBackgroundColor(isDarkMode ? '#333333' : '#ffffff')
    }

    updateBackgroundColor()

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateBackgroundColor)
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateBackgroundColor)
    }
  }, [])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)
    setMessage('')
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
      },
    ])
    setMessage('')
  }

  const startNewChat = () => {
    setRecentChats((prevChats) => [
      ...prevChats,
      { id: prevChats.length + 1, content: 'New Chat' }
    ])
    setShowChat(true)
    resetChat()
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      sx={{ backgroundColor: backgroundColor, position: 'relative' }}
    >
      {/* Sidebar */}
      <Box
        width="250px"
        bgcolor="primary.light"
        p={2}
        display={sidebarOpen ? 'flex' : 'none'}
        flexDirection="column"
        alignItems="center"
        sx={{
          borderRight: '1px solid grey',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          transition: 'transform 0.3s ease',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 1100,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: '100%',
            textAlign: 'center',
            transition: 'opacity 0.3s ease',
            opacity: sidebarOpen ? 0 : 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={toggleSidebar}
            sx={{
              borderRadius: '50%',
              padding: 1,
            }}
          >
            <Typography variant="h6" color="white">≡</Typography> {/* Menu icon */}
          </Button>
        </Box>

        <Typography variant="h4" color="white" fontWeight="bold">
          Wingman
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={startNewChat}
          sx={{ mt: 2, mb: 2, width: '100%' }}
        >
          New Chat
        </Button>
        <Box flexGrow={1} overflow="auto" width="100%">
          <List>
            {recentChats.map((chat) => (
              <ListItem button key={chat.id}>
                <ListItemText primary={`Chat ${chat.id}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        flexGrow={1}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        p={2}
      >
        {showChat && (
          <Stack
            direction={'column'}
            width="500px"
            height="700px"
            border="1px solid black"
            p={2}
            spacing={3}
            display="flex"
            flexDirection="column"
          >
            <Stack
              direction={'column'}
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
            >
              {messages.map((message, index) => (
                <Box key={index} display="flex" justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}>
                  <Box
                    bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                    color="white"
                    borderRadius={16}
                    p={3}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
            <Stack direction={'row'} spacing={2}>
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button 
                variant="contained" 
                onClick={sendMessage}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
              <Button 
                variant="contained" 
                onClick={resetChat}
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Wait' : 'Refresh'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      {/* Sidebar Toggle Button */}
      <Button
        variant="contained"
        color="primary"
        onClick={toggleSidebar}
        sx={{
          position: 'fixed',
          top: 16,
          left: sidebarOpen ? '250px' : '16px',
          zIndex: 1200,
          borderRadius: '50%',
          padding: 1,
          transition: 'left 0.3s ease',
        }}
      >
        <Typography variant="h6" color="white">≡</Typography> {/* Menu icon */}
      </Button>
    </Box>
  )
}
