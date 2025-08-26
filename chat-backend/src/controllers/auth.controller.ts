import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const { email, name, password } = req.body;
  try {
    const user = await AuthService.registerUser(email, name, password);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const { user, accessToken, refreshToken } = await AuthService.loginUser(email, password);
    res.json({ user, accessToken, refreshToken });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

