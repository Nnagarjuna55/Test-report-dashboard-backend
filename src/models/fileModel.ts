import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    name: string;
    path: string;
    isFolder: boolean;
    size: number;
    mimeType?: string;
    content?: string;
    parentPath?: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        description?: string;
        tags?: string[];
        author?: string;
        version?: string;
    };
}

const FileSchema = new Schema<IFile>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    path: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    isFolder: {
        type: Boolean,
        required: true,
        default: false
    },
    size: {
        type: Number,
        required: true,
        default: 0
    },
    mimeType: {
        type: String,
        trim: true
    },
    content: {
        type: String
    },
    parentPath: {
        type: String,
        trim: true
    },
    metadata: {
        description: {
            type: String,
            trim: true
        },
        tags: [{
            type: String,
            trim: true
        }],
        author: {
            type: String,
            trim: true
        },
        version: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true,
    collection: 'files'
});

FileSchema.index({ path: 1 });
FileSchema.index({ parentPath: 1 });
FileSchema.index({ isFolder: 1 });
FileSchema.index({ name: 'text', 'metadata.description': 'text' });

FileSchema.virtual('parent').get(function () {
    if (this.parentPath) {
        return this.parentPath;
    }
    const pathParts = this.path.split('/');
    pathParts.pop();
    return pathParts.join('/') || '/';
});

FileSchema.methods.getChildren = async function () {
    return await FileModel.find({ parentPath: this.path });
};

FileSchema.statics.pathExists = async function (path: string): Promise<boolean> {
    const file = await this.findOne({ path });
    return !!file;
};

FileSchema.statics.findByPath = async function (path: string) {
    return await this.findOne({ path });
};

FileSchema.statics.getDirectoryContents = async function (path: string) {
    return await this.find({ parentPath: path }).sort({ isFolder: -1, name: 1 });
};

FileSchema.statics.searchFiles = async function (query: string, limit: number = 50) {
    return await this.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(limit);
};

export const FileModel = mongoose.model<IFile>('File', FileSchema);