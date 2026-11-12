package com.campus.errand.controller;

import com.campus.errand.common.Result;
import com.campus.errand.service.impl.FileStorageService;
import com.campus.errand.vo.UploadVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "文件")
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @Operation(summary = "上传头像")
    @PostMapping("/avatar")
    public Result<UploadVO> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return Result.ok(new UploadVO(fileStorageService.storeAvatar(file)));
    }
}
