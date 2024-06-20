import { NextFunction, Request, Response } from "express";
import user from "../models/user.js";
import { configureOpenAI } from "../config/openai-config.js";
import { OpenAIApi, ChatCompletionRequestMessage } from "openai";

// Utility function to sleep for a given ms
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to handle retries for OpenAI API requests
async function requestWithRetry(apiFunction, params, retries = 3, delay = 1000) {
    try {
        return await apiFunction(params);
    } catch (error) {
        if (retries > 0 && error.response && error.response.status === 429) {
            console.log("Rate, limit, exceeded, retrying in ${delay} ms...");
            await sleep(delay);
            return requestWithRetry(apiFunction, params, retries - 1, delay * 2);
        }
        throw error;
    }
}

export const generateChatCompletion = async (req: Request, res: Response, next: NextFunction) => {
    const { message } = req.body;
    try {
        const users = await user.findById(res.locals.jwtData.id);
        if (!users) {
            console.log("No user found with ID:", res.locals.jwtData.id);
            return res.status(401).json({ message: "User not registered or Token malfunction" });
        }

        // Append user's message
        users.chats.push({ role: "user", content: message });

        const chats = users.chats.map(({ role, content }) => ({ role, content })) as ChatCompletionRequestMessage[];

        const config = configureOpenAI();
        const openai = new OpenAIApi(config);

        // Use retry logic for OpenAI API requests
        const chatResponse = await requestWithRetry(openai.createChatCompletion.bind(openai), {
            model: "gpt-3.5-turbo",
            messages: chats,
        });

        const botMessage = chatResponse.data.choices[0].message;
        users.chats.push({ role: botMessage.role, content: botMessage.content });
        await users.save();

        return res.status(200).json({ chats: users.chats });

    } catch (error) {
        console.error("Failed to generate chat completion:", error);
        return res.status(500).json({ message: "Something went wrong", error: error.message });
    }
};

export const sendChatsToUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await user.findById(res.locals.jwtData.id);
        if (!users) {
            return res.status(401).send("User not registered or Token malfunction");
        }
        if (users._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        return res.status(200).json({ message: "OK", chats: users.chats });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};

export const deleteChats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await user.findById(res.locals.jwtData.id);
        if (!users) {
            return res.status(401).send("User not registered or Token malfunction");
        }
        if (users._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        // Clear chats
        users.chats = [];
        await users.save();
        return res.status(200).json({ message: "OK" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};

