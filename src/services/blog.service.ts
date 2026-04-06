const API_URL = "https://gamersbd-server.onrender.com/api/blogs";

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    email: string;
  };
  tags: string[];
  featured: boolean;
  views: number;
  likes: number;
  comments: any[];
  commentCount: number;
  publishedAt: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const handleResponse = async (response: Response) => {
  const data = await response.json();
  console.log("API Response:", { status: response.status, data });
  
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
};

export const blogService = {
  async getAllBlogs(params?: any): Promise<Blog[]> {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_URL}${queryParams ? `?${queryParams}` : ''}`;
    console.log("Fetching blogs from:", url);
    
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data.data;
  },

  async getBlogByIdentifier(identifier: string): Promise<Blog> {
    const response = await fetch(`${API_URL}/${identifier}`);
    const data = await handleResponse(response);
    return data.data;
  },

  async createBlog(blogData: any): Promise<Blog> {
    console.log("Creating blog with data:", blogData);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blogData),
    });
    
    const data = await handleResponse(response);
    console.log("Blog created successfully:", data);
    return data.data;
  },

  async updateBlog(id: string, blogData: any): Promise<Blog> {
    console.log("Updating blog:", id, blogData);
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blogData),
    });
    
    const data = await handleResponse(response);
    return data.data;
  },

  async deleteBlog(id: string): Promise<void> {
    console.log("Deleting blog:", id);
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    
    await handleResponse(response);
  },

  async likeBlog(id: string): Promise<{ likes: number }> {
    const response = await fetch(`${API_URL}/${id}/like`, {
      method: "POST",
    });
    const data = await handleResponse(response);
    return data.data;
  },
};