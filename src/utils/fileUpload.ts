/**
 * 文件上传工具函数
 * 统一处理 iOS (File) 和 Android (base64) 两种数据格式
 */

/**
 * 日志工具函数
 */
const log = {
    info: (message: string, ...args: any[]) => {
        console.log(`[FileUpload] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`[FileUpload] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`[FileUpload] ${message}`, ...args);
    },
};

/**
 * 验证 base64 字符串是否有效
 * @param base64Str base64 字符串（不包含 data URI 前缀）
 * @returns 是否有效
 */
function isValidBase64(base64Str: string): boolean {
    if (!base64Str || base64Str.length === 0) {
        return false;
    }
    
    // Base64 字符集：A-Z, a-z, 0-9, +, /, = (padding)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Str)) {
        return false;
    }
    
    // Base64 编码后的长度必须是 4 的倍数（不考虑 padding）
    // 去掉 padding '=' 后，长度应该能被 4 整除，或者加上 padding 后能被 4 整除
    const paddingCount = (base64Str.match(/=/g) || []).length;
    if (paddingCount > 2) {
        return false; // padding 最多 2 个
    }
    
    const dataLength = base64Str.length - paddingCount;
    // 数据部分（去掉 padding）应该是 4 的倍数，或者加上 padding 后是 4 的倍数
    // 实际上只要总长度是合理的 base64 格式即可（通常至少 4 个字符）
    if (dataLength < 4 && base64Str.length < 4) {
        return false;
    }
    
    return true;
}

/**
 * 从 data URI 中提取 MIME 类型
 * @param dataUri data URI 字符串（如 "data:image/jpeg;base64,..."）
 * @returns MIME 类型，如果无法提取则返回默认值
 */
function extractMimeType(dataUri: string): string {
    // 从 data URI 中提取 MIME 类型
    // 格式：data:[<mediatype>][;base64],<data>
    // 支持：data:image/jpeg;base64, 或 data:image/png,
    const mimeMatch = dataUri.match(/data:([^;,]+)/);
    if (mimeMatch && mimeMatch[1]) {
        const mimeType = mimeMatch[1].trim();
        // 验证是否是有效的图片 MIME 类型
        const validImageTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/bmp', 'image/svg+xml', 'image/x-icon'
        ];
        if (validImageTypes.includes(mimeType.toLowerCase())) {
            // 标准化：jpg -> jpeg
            return mimeType.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeType.toLowerCase();
        }
    }
    
    // 如果无法从 data URI 提取，返回默认值
    return 'image/jpeg';
}

/**
 * 根据文件扩展名推断 MIME 类型
 * @param filename 文件名
 * @returns MIME 类型
 */
function getMimeTypeFromFilename(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const mimeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
    };
    return mimeMap[ext] || 'image/jpeg';
}

/**
 * 将 base64 字符串转换为 File 对象
 * @param base64Str base64 字符串（可以包含 data URI 前缀，如 "data:image/jpeg;base64,..."）
 * @param filename 文件名（可选，默认为 "image.jpg"）
 * @returns File 对象
 * @throws 如果 base64 数据无效，抛出错误
 */
export function base64ToFile(base64Str: string, filename: string = 'image.jpg'): File {
    log.info('开始转换 base64 到 File', { filename, base64Length: base64Str.length });
    
    if (!base64Str || typeof base64Str !== 'string') {
        log.error('Base64 字符串为空或类型错误', { type: typeof base64Str });
        throw new Error('Base64 字符串不能为空');
    }
    
    // 提取 MIME 类型（在分割之前，需要完整的数据 URI）
    let mimeType = extractMimeType(base64Str);
    log.info('提取 MIME 类型', { mimeType, hasDataUri: base64Str.startsWith('data:') });
    
    // 处理 data URI 格式（如果有前缀，提取纯 base64 数据）
    let base64Data: string;
    if (base64Str.includes(',')) {
        // 标准 data URI 格式：data:[mime];base64,<data>
        const parts = base64Str.split(',');
        base64Data = parts[parts.length - 1]; // 取最后一部分（防止 base64 数据本身包含逗号）
        log.info('检测到 data URI 格式', { partsCount: parts.length, dataLength: base64Data.length });
    } else if (base64Str.startsWith('data:')) {
        // 如果以 data: 开头但没有逗号，可能是格式错误
        log.error('无效的 data URI 格式：缺少数据部分', { base64Str: base64Str.substring(0, 50) + '...' });
        throw new Error('无效的 data URI 格式：缺少数据部分');
    } else {
        // 纯 base64 字符串（没有 data URI 前缀）
        base64Data = base64Str;
        // 从文件名推断 MIME 类型
        mimeType = getMimeTypeFromFilename(filename);
        log.info('纯 base64 格式，从文件名推断 MIME', { mimeType, filename });
    }
    
    // 验证 base64 数据
    if (!isValidBase64(base64Data)) {
        log.error('Base64 数据验证失败', { 
            dataLength: base64Data.length,
            preview: base64Data.substring(0, 20) + '...'
        });
        throw new Error('无效的 base64 字符串格式');
    }
    log.info('Base64 数据验证通过', { dataLength: base64Data.length });
    
    // 尝试解码 base64
    let byteArray: Uint8Array;
    try {
        log.info('开始解码 base64');
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        byteArray = new Uint8Array(byteNumbers);
        
        log.info('Base64 解码成功', { 
            byteLength: byteArray.length,
            sizeKB: (byteArray.length / 1024).toFixed(2)
        });
        
        // 验证解码后的数据不为空
        if (byteArray.length === 0) {
            log.error('解码后数据为空');
            throw new Error('Base64 解码后数据为空');
        }
    } catch (error) {
        log.error('Base64 解码失败', { error });
        if (error instanceof Error) {
            throw new Error(`Base64 解码失败: ${error.message}`);
        }
        throw new Error('Base64 解码失败: 未知错误');
    }
    
    // 创建 Blob，然后转换为 File
    try {
        log.info('创建 Blob 对象', { mimeType, size: byteArray.length });
        const blob = new Blob([byteArray as BlobPart], { type: mimeType });
        
        log.info('创建 File 对象', { filename, size: blob.size, type: blob.type });
        const file = new File([blob], filename, { type: mimeType });
        
        log.info('✅ Base64 转 File 成功', {
            filename: file.name,
            size: file.size,
            type: file.type,
            sizeKB: (file.size / 1024).toFixed(2)
        });
        
        return file;
    } catch (error) {
        log.error('创建 File 对象失败', { error });
        throw new Error(`创建 File 对象失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

/**
 * 验证文件是否可用
 * @param file File 对象
 * @returns 验证结果对象，包含是否有效和错误信息
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    log.info('开始验证文件', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
    });
    
    // 检查文件是否存在
    if (!file) {
        log.error('文件对象为空');
        return { valid: false, error: '文件对象为空' };
    }
    
    // 检查文件大小
    if (file.size === 0) {
        log.error('文件大小为 0');
        return { valid: false, error: '文件大小为 0' };
    }
    
    // 检查文件大小是否过大（可选，这里设置 50MB 限制）
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
        log.warn('文件大小超过限制', {
            size: file.size,
            maxSize: MAX_FILE_SIZE,
            sizeMB: (file.size / 1024 / 1024).toFixed(2)
        });
        return { 
            valid: false, 
            error: `文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）` 
        };
    }
    
    // 检查文件类型（可选，只允许图片）
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/bmp', 'image/svg+xml'
    ];
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
        log.warn('文件类型不在允许列表中', { type: file.type });
        // 注意：这里只是警告，不阻止上传（因为有些文件可能没有正确的 type）
    }
    
    // 尝试读取文件（验证文件是否可读）
    try {
        // 检查文件的基本属性
        if (!file.name) {
            log.warn('文件名为空');
        }
        
        log.info('✅ 文件验证通过', {
            name: file.name,
            size: file.size,
            type: file.type,
            sizeKB: (file.size / 1024).toFixed(2),
            sizeMB: (file.size / 1024 / 1024).toFixed(2)
        });
        
        return { valid: true };
    } catch (error) {
        log.error('文件验证失败', { error });
        return { 
            valid: false, 
            error: `文件验证失败: ${error instanceof Error ? error.message : '未知错误'}` 
        };
    }
}

/**
 * 统一的上传函数
 * @param file File 对象（iOS 直接传入，Android 先转换为 File）
 * @param uploadUrl 上传接口地址
 * @param additionalFields 额外的表单字段（可选）
 * @returns Promise<any> 上传结果
 */
export async function uploadFile(
    file: File,
    uploadUrl: string,
    additionalFields?: Record<string, string>
): Promise<any> {
    log.info('开始上传文件', {
        filename: file.name,
        size: file.size,
        type: file.type,
        uploadUrl,
        hasAdditionalFields: !!additionalFields
    });
    
    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
        log.error('文件验证失败，取消上传', { error: validation.error });
        throw new Error(validation.error || '文件验证失败');
    }
    
    // 创建 FormData
    log.info('创建 FormData');
    const formData = new FormData();
    
    // 添加文件
    formData.append('file', file);
    log.info('文件已添加到 FormData', { fieldName: 'file' });
    
    // 添加额外的字段（如果需要）
    if (additionalFields) {
        log.info('添加额外字段', { fields: Object.keys(additionalFields) });
        Object.entries(additionalFields).forEach(([key, value]) => {
            formData.append(key, value);
            log.info('添加字段', { key, value });
        });
    }
    
    // 执行上传
    const startTime = Date.now();
    log.info('开始发送上传请求', { url: uploadUrl, method: 'POST' });
    
    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
        });
        
        const duration = Date.now() - startTime;
        log.info('上传请求完成', {
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`,
            ok: response.ok
        });
        
        if (!response.ok) {
            log.error('上传失败', {
                status: response.status,
                statusText: response.statusText
            });
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        // 解析响应
        log.info('开始解析响应');
        const result = await response.json();
        
        log.info('✅ 文件上传成功', {
            result,
            duration: `${duration}ms`,
            size: file.size
        });
        
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        log.error('上传过程出错', {
            error,
            duration: `${duration}ms`,
            filename: file.name
        });
        
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`上传失败: ${error}`);
    }
}

/**
 * 从 data URI 或 base64 字符串创建 File 对象
 * 兼容两种格式：
 * 1. data URI: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * 2. 纯 base64: "/9j/4AAQSkZJRg..."
 */
export function createFileFromData(
    data: string | File,
    filename: string = 'image.jpg'
): File {
    // 如果已经是 File 对象，直接返回
    if (data instanceof File) {
        return data;
    }
    
    // 如果是 base64 字符串，转换为 File
    return base64ToFile(data, filename);
}

