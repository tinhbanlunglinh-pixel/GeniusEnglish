import React, { useState } from 'react';
import { fileToBase64, extractTextFromImage } from '../services/geminiService';

export const MindMapPromptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Học sinh tiểu học');
  const [focus, setFocus] = useState('Từ vựng và Ngữ pháp');
  const [sourceText, setSourceText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsExtracting(true);
      try {
        const newImages = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const base64 = await fileToBase64(file);
          newImages.push({ data: base64, mimeType: file.type || 'image/jpeg' });
        }
        const text = await extractTextFromImage(newImages);
        setSourceText(prev => prev ? prev + '\n\n' + text : text);
      } catch (err) {
        alert("Lỗi trích xuất văn bản từ ảnh. Vui lòng kiểm tra lại API Key.");
      } finally {
        setIsExtracting(false);
      }
      e.target.value = '';
    }
  };

  const generatePrompt = () => {
    let prompt = `Đóng vai là một chuyên gia thiết kế sơ đồ tư duy (Mind Map) cho giáo dục tiếng Anh.
Hãy tạo một sơ đồ tư duy chi tiết về chủ đề: "${topic || '[Nhập chủ đề vào đây]'}"
- Đối tượng: ${targetAudience}
- Trọng tâm: ${focus}

Yêu cầu định dạng đầu ra:
1. Chủ đề chính (Core)
2. Các nhánh chính (Branches) liên quan đến từ vựng, mẫu câu, và ngữ pháp.
3. Mỗi nhánh chính có 3-4 nhánh phụ (Sub-branches) kèm theo ví dụ minh hoạ dễ hiểu.
4. Trình bày dưới dạng JSON hoặc danh sách phân cấp (Bullet points) rõ ràng, sử dụng emoji phù hợp để minh hoạ.`;

    if (sourceText.trim()) {
      prompt += `\n\nNguồn tài liệu tham khảo (hãy dựa vào nội dung này để xây dựng sơ đồ):\n"""\n${sourceText.trim()}\n"""`;
    }
    return prompt;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePrompt());
    alert('Đã copy Prompt vào clipboard! Bạn có thể dán vào ChatGPT hoặc Gemini.');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl p-8 border-4 border-slate-100 animate-fade-in my-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-brand-900 font-display mb-2">🌈 Prompt Generator</h2>
        <p className="text-slate-500 font-medium">Tạo câu lệnh (Prompt) chuẩn xác để nhờ AI thiết kế Sơ đồ tư duy</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề bài học (Topic)</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Động vật (Animals), Gia đình (Family)..."
              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Đối tượng học sinh</label>
            <select 
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none font-medium"
            >
              <option value="Trẻ mầm non (3-5 tuổi)">Trẻ mầm non (3-5 tuổi)</option>
              <option value="Học sinh tiểu học (6-10 tuổi)">Học sinh tiểu học (6-10 tuổi)</option>
              <option value="Học sinh THCS (11-15 tuổi)">Học sinh THCS (11-15 tuổi)</option>
              <option value="Người mới bắt đầu học">Người mới bắt đầu học</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Trọng tâm kiến thức</label>
            <select 
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none font-medium"
            >
              <option value="Từ vựng và Ngữ pháp">Từ vựng và Ngữ pháp cơ bản</option>
              <option value="Mẫu câu giao tiếp">Mẫu câu giao tiếp thực tế</option>
              <option value="Cấu trúc câu hỏi và trả lời">Cấu trúc câu hỏi và trả lời</option>
            </select>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">Nội dung bài học (Text)</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    if (!topic) return alert("Vui lòng nhập chủ đề trước khi tạo nội dung!");
                    setIsExtracting(true);
                    try {
                      const { generateContentForMindMap } = await import('../services/geminiService');
                      const content = await generateContentForMindMap(topic, targetAudience, focus);
                      setSourceText(content);
                    } catch (e) {
                      alert("Có lỗi xảy ra khi tạo nội dung.");
                    } finally {
                      setIsExtracting(false);
                    }
                  }}
                  disabled={isExtracting}
                  className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md hover:bg-brand-100 transition-colors"
                >
                  {isExtracting ? "⏳ Đang tạo..." : "✨ Tạo nội dung"}
                </button>
                <div className="relative overflow-hidden cursor-pointer">
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={isExtracting} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors">
                    📸 Quét ảnh sách
                  </span>
                </div>
              </div>
            </div>
            <textarea 
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Dán nội dung bài học, từ vựng... vào đây. Hoặc bấm 'Tạo nội dung' để AI tự viết."
              className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none font-medium h-32 resize-y text-sm"
              disabled={isExtracting}
            />
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 flex flex-col h-full">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            ✨ Prompt được tạo ra:
          </h3>
          <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 text-sm font-mono text-slate-600 whitespace-pre-wrap overflow-y-auto">
            {generatePrompt()}
          </div>
          <button 
            onClick={handleCopy}
            className="mt-4 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            📋 Copy Prompt
          </button>
        </div>
      </div>
    </div>
  );
};
