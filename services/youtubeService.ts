import type { VideoData } from '../types';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Tách ID kênh từ các định dạng URL khác nhau một cách thông minh
export async function getChannelIdFromUrl(url: string, apiKey: string): Promise<string> {
    try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split('/').filter(p => p);

        // Xử lý URL có dạng /channel/UC...
        if (pathParts[0] === 'channel' && pathParts[1]?.startsWith('UC')) {
            return pathParts[1];
        }

        // Xử lý URL tùy chỉnh /c/handle hoặc /@handle
        const handle = pathParts[0] === 'c' 
            ? pathParts[1] 
            : pathParts[0]?.startsWith('@') 
            ? pathParts[0].substring(1) 
            : null;

        if (handle) {
            // Sử dụng search endpoint để tìm ID kênh từ handle
            const searchUrl = `${API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&key=${apiKey}`;
            const response = await fetch(searchUrl);
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                 // Ưu tiên kết quả khớp chính xác với customUrl hoặc title
                const exactMatch = data.items.find((item: any) => 
                    item.snippet.customUrl?.toLowerCase() === handle.toLowerCase() ||
                    item.snippet.title?.toLowerCase() === handle.toLowerCase()
                );
                if (exactMatch) return exactMatch.snippet.channelId;
                return data.items[0].snippet.channelId; // Lấy kết quả đầu tiên nếu không có khớp chính xác
            }
        }
        
        // Thử tìm ID kênh từ tên người dùng (định dạng cũ)
        const username = pathParts[0] === 'user' ? pathParts[1] : null;
        if(username) {
             const userUrl = `${API_BASE_URL}/channels?part=id&forUsername=${username}&key=${apiKey}`;
             const response = await fetch(userUrl);
             const data = await response.json();
             if (data.items && data.items.length > 0) {
                 return data.items[0].id;
             }
        }

        throw new Error("Định dạng URL không được hỗ trợ hoặc không tìm thấy kênh.");

    } catch (e) {
         throw new Error("URL kênh không hợp lệ.");
    }
}


// Lấy ID của playlist chứa các video đã tải lên
export async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string> {
    const url = `${API_BASE_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
        throw new Error("Không tìm thấy kênh với ID được cung cấp.");
    }
    return data.items[0].contentDetails.relatedPlaylists.uploads;
}

// Lấy ID các video từ playlist, hỗ trợ phân trang
export async function getPaginatedVideoIds(playlistId: string, apiKey:string, pageToken?: string): Promise<{ videoIds: string[], nextPageToken?: string }> {
    let url = `${API_BASE_URL}/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50&key=${apiKey}`;
    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        throw new Error(`Lỗi YouTube API: ${data.error.message}`);
    }
    if (!data.items) {
        // This can happen on a valid channel with no videos
        return { videoIds: [], nextPageToken: undefined };
    }
    
    const videoIds = data.items.map((item: any) => item.contentDetails.videoId);
    return { videoIds, nextPageToken: data.nextPageToken };
}

// Chuyển đổi thời lượng ISO 8601 sang định dạng dễ đọc (HH:MM:SS hoặc MM:SS)
function parseISO8601Duration(duration: string): string {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) {
        return '00:00';
    }

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
}

// Lấy thông tin chi tiết của video (thống kê, snippet, thời lượng)
export async function getVideoDetails(videoIds: string[], apiKey: string): Promise<VideoData[]> {
    if (videoIds.length === 0) return [];
    
    const url = `${API_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        views: parseInt(item.statistics.viewCount, 10) || 0,
        likes: parseInt(item.statistics.likeCount, 10) || 0,
        summary: 'Đang chờ tóm tắt...',
        duration: parseISO8601Duration(item.contentDetails.duration),
    }));
}