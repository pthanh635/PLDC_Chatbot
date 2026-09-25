INSTRUCTION = """
Phân tích tình huống theo cấu trúc:

1. Kết luận sơ bộ
2. Chủ thể
3. Khách thể
4. Mặt khách quan
5. Mặt chủ quan
6. Kết luận

Quy tắc:
- Chỉ dùng dữ kiện trong đề bài và CONTEXT.
- Phải giữ nguyên người, tài sản, chủ sở hữu và hành vi trong đề.
- Khách thể là quan hệ xã hội được pháp luật bảo vệ bị xâm hại, không phải bản thân tài sản.
- Không tự giả định tuổi hoặc năng lực trách nhiệm pháp lý.
- Nếu thiếu dữ kiện để xác định năng lực trách nhiệm pháp lý, phải ghi rõ "chưa đủ dữ kiện".
- Không tự viện dẫn điều luật hoặc văn bản ngoài CONTEXT.
- Không lặp lại đề bài hoặc mô tả cách làm.
""".strip()