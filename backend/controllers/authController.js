import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { JWT_SECRET } from '../config/jwt.js';

export const register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password, fullName, role } = req.body;
    
    if (!email || !password || !fullName) {
      console.log('Missing required fields:', { email: !!email, password: !!password, fullName: !!fullName });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Error checking user existence' });
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        full_name: fullName,
        role: role || 'user'
      })
      .select('id, email, full_name, role')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return res.status(500).json({ error: 'Error creating user: ' + createError.message });
    }

    if (!newUser) {
      console.error('No user data returned after creation');
      return res.status(500).json({ error: 'Error creating user: No data returned' });
    }

    console.log('User created successfully:', newUser);

    const token = jwt.sign({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    }, JWT_SECRET);

    console.log('JWT token generated');
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error('Unexpected registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError) throw findError;
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET);

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', req.user.userId)
      .single();

    if (error) throw error;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 