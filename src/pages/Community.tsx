import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MessageSquare, ThumbsUp, Send, Tag, Filter, Clock, Hash, Users } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

type CommunityPost = {
  id: string;
  author: string;
  content: string;
  tags: string[];
  createdAt: number;
  likes: number;
  comments: Array<{ id: string; author: string; content: string; createdAt: number }>;
};

const STORAGE_KEY = 'kaizo.community.posts.v1';

const defaultSeedPosts: CommunityPost[] = [
  {
    id: 'seed-1',
    author: 'Asha',
    content: 'Any tips for finding palm-oil-free snacks? Also curious about your favorite low-water-footprint meals 🌱',
    tags: ['tips', 'palm-oil', 'sustainability'],
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    likes: 7,
    comments: [
      { id: 'c1', author: 'Leo', content: 'Roasted chickpeas ftw! Also check labels for RSPO certs.', createdAt: Date.now() - 1000 * 60 * 60 * 5 },
    ],
  },
  {
    id: 'seed-2',
    author: 'Maya',
    content: 'Just discovered an amazing oat-milk based chai recipe. Super creamy without the footprint of almonds ☕️',
    tags: ['recipes', 'oat-milk'],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    likes: 12,
    comments: [],
  },
];

const getInitialPosts = (): CommunityPost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSeedPosts;
    const parsed = JSON.parse(raw) as CommunityPost[];
    return Array.isArray(parsed) ? parsed : defaultSeedPosts;
  } catch {
    return defaultSeedPosts;
  }
};

const savePosts = (posts: CommunityPost[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // ignore
  }
};

const normalizeTag = (t: string) => t.trim().toLowerCase().replace(/^#/, '');

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>(getInitialPosts);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [composer, setComposer] = useState<{ author: string; content: string; tags: string }>({ 
    author: user?.user_metadata?.full_name || user?.email || '', 
    content: '', 
    tags: '' 
  });
  const supaReady = Boolean(supabase);

  // Update composer author when user changes
  useEffect(() => {
    if (user) {
      setComposer(prev => ({ 
        ...prev, 
        author: user.user_metadata?.full_name || user.email || 'User' 
      }));
    }
  }, [user]);

  // Local persistence (fallback when Supabase not configured)
  useEffect(() => {
    if (!supaReady) savePosts(posts);
  }, [posts, supaReady]);

  // Fetch from Supabase when configured
  useEffect(() => {
    const init = async () => {
      if (!supaReady) return;
      const { data, error } = await supabase
        .from('community_posts')
        .select('id, author, content, tags, created_at, likes, comments:community_comments(id, author, content, created_at)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to load community posts:', error);
        toast({ title: 'Community offline', description: 'Falling back to local storage.' });
        return;
      }
      const normalized: CommunityPost[] = (data || []).map((row: any) => ({
        id: row.id,
        author: row.author || 'Guest',
        content: row.content,
        tags: Array.isArray(row.tags) ? row.tags : [],
        createdAt: new Date(row.created_at).getTime(),
        likes: row.likes || 0,
        comments: (row.comments || []).map((c: any) => ({
          id: c.id,
          author: c.author || 'Guest',
          content: c.content,
          createdAt: new Date(c.created_at).getTime(),
        }))
      }));
      setPosts(normalized);

      // Realtime using broadcast channels (available now)
      const channel = supabase.channel('community_room');
      
      channel
        .on('broadcast', { event: 'new_post' }, (payload) => {
          const post = payload.payload as CommunityPost;
          setPosts(prev => prev.some(p => p.id === post.id) ? prev : [post, ...prev]);
        })
        .on('broadcast', { event: 'new_comment' }, (payload) => {
          const { postId, comment } = payload.payload;
          setPosts(prev => prev.map(p => p.id === postId ? {
            ...p,
            comments: p.comments.some(c => c.id === comment.id) ? p.comments : [...p.comments, comment]
          } : p));
        })
        .on('broadcast', { event: 'post_liked' }, (payload) => {
          const { postId, newLikes } = payload.payload;
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
        })
        .subscribe();

      // Polling fallback for data sync every 30 seconds
      const pollInterval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('community_posts')
            .select('id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (data && data.length > 0) {
            const latestServerTime = new Date(data[0].created_at).getTime();
            const latestLocalTime = posts.length > 0 ? posts[0].createdAt : 0;
            
            // If server has newer posts, refresh
            if (latestServerTime > latestLocalTime) {
              const { data: freshData } = await supabase
                .from('community_posts')
                .select('id, author, content, tags, created_at, likes, comments:community_comments(id, author, content, created_at)')
                .order('created_at', { ascending: false });
              
              if (freshData) {
                const normalized: CommunityPost[] = freshData.map((row: any) => ({
                  id: row.id,
                  author: row.author || 'Guest',
                  content: row.content,
                  tags: Array.isArray(row.tags) ? row.tags : [],
                  createdAt: new Date(row.created_at).getTime(),
                  likes: row.likes || 0,
                  comments: (row.comments || []).map((c: any) => ({
                    id: c.id,
                    author: c.author || 'Guest',
                    content: c.content,
                    createdAt: new Date(c.created_at).getTime(),
                  }))
                }));
                setPosts(normalized);
              }
            }
          }
        } catch (error) {
          console.warn('Polling sync failed:', error);
        }
      }, 30000);

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    };
    const cleanup = init();
    return () => { cleanup && typeof cleanup === 'function' && cleanup(); };
  }, [supaReady]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => p.tags.forEach(t => set.add(t)));
    return ['all', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return filterTag === 'all' ? posts : posts.filter(p => p.tags.includes(filterTag));
  }, [posts, filterTag]);

  const addPost = async () => {
    const author = composer.author.trim() || 'Guest';
    const content = composer.content.trim();
    const tags = composer.tags
      .split(',')
      .map(normalizeTag)
      .filter(Boolean);

    if (!content) {
      toast({ title: 'Add some content', description: 'Write a message to share with the community.' });
      return;
    }

    if (supaReady) {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({ author, content, tags })
        .select('*')
        .single();
      if (error) {
        console.error('Failed to post:', error);
        toast({ title: 'Failed to post', description: 'Please try again.' });
        return;
      }
      
      const newPost: CommunityPost = {
        id: data.id,
        author: data.author || 'Guest',
        content: data.content,
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: new Date(data.created_at).getTime(),
        likes: data.likes || 0,
        comments: []
      };
      
      setPosts(prev => [newPost, ...prev]);
      
      // Broadcast to other users
      await supabase.channel('community_room').send({
        type: 'broadcast',
        event: 'new_post',
        payload: newPost
      });
    } else {
      const newPost: CommunityPost = {
        id: crypto.randomUUID(),
        author,
        content,
        tags,
        createdAt: Date.now(),
        likes: 0,
        comments: [],
      };
      setPosts(prev => [newPost, ...prev]);
    }
    setComposer({ author: composer.author, content: '', tags: '' });
    toast({ title: 'Posted!', description: 'Your post is now live for the community.' });
  };

  const addComment = async (postId: string, text: string) => {
    const authorName = user?.user_metadata?.full_name || user?.email || 'Guest';
    
    if (supaReady) {
      const { data, error } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, author: authorName, content: text })
        .select('*')
        .single();
      if (error) {
        console.error('Failed to comment:', error);
        toast({ title: 'Failed to comment', description: 'Please try again.' });
        return;
      }
      
      const newComment = { 
        id: data.id, 
        author: data.author || 'Guest', 
        content: data.content, 
        createdAt: new Date(data.created_at).getTime() 
      };
      
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: [...p.comments, newComment]
      } : p));
      
      // Broadcast to other users
      await supabase.channel('community_room').send({
        type: 'broadcast',
        event: 'new_comment',
        payload: { postId, comment: newComment }
      });
    } else {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        comments: [...p.comments, { id: crypto.randomUUID(), author: authorName, content: text, createdAt: Date.now() }]
      } : p));
    }
  };

  const likePost = async (postId: string) => {
    if (supaReady) {
      const { data, error } = await supabase.rpc('community_like_post', { p_post_id: postId });
      if (error) {
        console.error('Failed to like:', error);
        toast({ title: 'Failed to like', description: 'Please try again.' });
        return;
      }
      
      const newLikes = data?.likes ?? (posts.find(p => p.id === postId)?.likes ?? 0) + 1;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
      
      // Broadcast to other users
      await supabase.channel('community_room').send({
        type: 'broadcast',
        event: 'post_liked',
        payload: { postId, newLikes }
      });
    } else {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" /> Vegan Community
        </h1>
        <p className="text-muted-foreground">Share tips, recipes, product finds, and support with fellow vegans.</p>
      </div>

      {/* Composer */}
      <Card className="shadow-card mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Start a discussion
          </CardTitle>
          <CardDescription>Be friendly and constructive. Add tags like #recipes, #palm-oil, #restaurants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="text-sm font-medium">Display name</label>
              <Input
                placeholder="Your name (optional)"
                value={composer.author}
                onChange={(e) => setComposer({ ...composer, author: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Tag className="w-4 h-4 text-muted-foreground mt-3" />
                <Input
                  placeholder="#recipes, #sustainability"
                  value={composer.tags}
                  onChange={(e) => setComposer({ ...composer, tags: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="What would you like to share?"
              value={composer.content}
              onChange={(e) => setComposer({ ...composer, content: e.target.value })}
              rows={4}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addPost} className="gap-2">
              <Send className="w-4 h-4" /> Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by tag:</span>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={cn('cursor-pointer capitalize', filterTag === tag ? 'bg-primary text-primary-foreground' : 'bg-accent')}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback>{post.author?.[0]?.toUpperCase() || 'G'}</AvatarFallback></Avatar>
                  <div>
                    <CardTitle className="text-base">{post.author || 'Guest'}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {new Date(post.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map(t => (
                    <Badge key={t} variant="secondary" className="capitalize"><Hash className="w-3 h-3 mr-1" />{t}</Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => likePost(post.id)} className="gap-2">
                  <ThumbsUp className="w-4 h-4" /> {post.likes}
                </Button>
              </div>

              <Separator />

              {/* Comments */}
              <div className="space-y-3">
                {post.comments.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback>{c.author?.[0]?.toUpperCase() || 'G'}</AvatarFallback></Avatar>
                    <div className="bg-muted/40 p-3 rounded-lg w-full">
                      <div className="text-sm font-medium">{c.author || 'Guest'}</div>
                      <div className="text-sm text-muted-foreground mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                      <div className="text-sm">{c.content}</div>
                    </div>
                  </div>
                ))}
                <CommentComposer onSubmit={(text) => addComment(post.id, text)} />
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center text-muted-foreground py-8">No posts yet for this tag. Be the first to share!</div>
        )}
      </div>
    </div>
  );
};

const CommentComposer = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
  const [text, setText] = useState('');
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Write a comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text.trim()) {
            onSubmit(text.trim());
            setText('');
          }
        }}
      />
      <Button
        variant="secondary"
        onClick={() => {
          if (!text.trim()) return;
          onSubmit(text.trim());
          setText('');
        }}
        className="gap-2"
      >
        <Send className="w-4 h-4" />
        Send
      </Button>
    </div>
  );
};

export default Community;


