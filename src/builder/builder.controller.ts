import {
	BadRequestException,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { Request, Response } from "express";
import { createReadStream, pathExists } from "fs-extra";

import { getApkDir } from "./constants";
import { AdminGuard } from "../admin.guard";
import { BuilderService } from "./builder.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { WebhookGuard } from "./webhook.guard";
import { join } from "path";

@Controller("builder")
export class BuilderController {
	constructor(private builderService: BuilderService) {}

	@Post("upload")
	@UseInterceptors(FileInterceptor("file"))
	@UseGuards(AdminGuard)
	async receiveAPKFile(
		@UploadedFile() file: Express.Multer.File,
		@Req() req: Request,
	) {
		if (!file)
			throw new BadRequestException("You must include a file to upload.");

		return await this.builderService.handleFileUpload(file, req);
	}

	@Get("download/:file")
	async getAPKFile(@Res() res: Response, @Param() params) {
		const path = join(getApkDir(), params.file);

		if (!(await pathExists(path)))
			throw new NotFoundException("File not found");

		const file = createReadStream(path);

		res.setHeader("Content-Type", "application/vnd.android.package-archive");

		file.pipe(res);
	}

	@Post("webhook")
	@UseGuards(WebhookGuard)
	async receiveWebhook(@Req() req: Request) {
		return await this.builderService.handleWebhook(req);
	}
}
