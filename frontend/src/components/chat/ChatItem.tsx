import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Extracts code blocks and text blocks from the message
function extractCodeFromString(message: string) {
    if (message.includes("```")) {
        const blocks = message.split("```");
        return blocks;
    }
    return [message];
}

// Determines if a block of text is code based on simple heuristics
function isCodeBlock(str: string) {
    if (
        str.includes("=") ||
        str.includes(";") ||
        str.includes("[") ||
        str.includes("]") ||
        str.includes("{") ||
        str.includes("}") ||
        str.includes("#") ||
        str.includes("//")
    ) {
        return true;
    }
    return false;
}

const ChatItem = ({
    content,
    role,
}) => {
    const messageBlocks = extractCodeFromString(content); 
    const auth = useAuth();
    
    const getUserInitials = (name) => {
        if (!name) return "U";
        const nameParts = name.split(" ");
        const initials = nameParts.map(part => part[0]).join("").toUpperCase();
        return initials;
    };

    return role === "assistant" ? (
        <Box sx={{ display: "flex", p: 2, bgcolor: "#004d5612", my: 1, gap: 2, borderRadius: 2 }}>
            <Avatar sx={{ ml: "0" }}>
                <img src="openai.png" alt="openai" width={"30px"} />
            </Avatar>
            <Box>
                {messageBlocks.map((block, index) => 
                    isCodeBlock(block) ? (
                        <SyntaxHighlighter key={index} style={coldarkDark} language="javascript">
                            {block}
                        </SyntaxHighlighter>
                    ) : (
                        <Typography key={index} sx={{ fontSize: "20px" }}>
                            {block}
                        </Typography>
                    )
                )}
            </Box>
        </Box>
    ) : (
        <Box sx={{ display: "flex", p: 2, bgcolor: "#004d56", gap: 2, my: 2, borderRadius: 2 }}>
            <Avatar sx={{ ml: "0", bgcolor: "black", color: "white" }}>
                {getUserInitials(auth?.user?.name)}
            </Avatar>
            <Box>
                {messageBlocks.map((block, index) => 
                    isCodeBlock(block) ? (
                        <SyntaxHighlighter key={index} style={coldarkDark} language="javascript">
                            {block}
                        </SyntaxHighlighter>
                    ) : (
                        <Typography key={index} sx={{ fontSize: "20px" }}>
                            {block}
                        </Typography>
                    )
                )}
            </Box>      
        </Box>
    );
};

export default ChatItem;