import {UserObj, UserObjShort} from "@/types/user";

export interface PeriodStats {
    storageUsed: number;
    image: {
        total: number;
        bestUploader?: {
            count: number;
            user: UserObjShort;
        };
    };
    paste: {
        total: number;
        bestUploader?: {
            count: number;
            user: UserObjShort;
        };
    };
    url: {
        total: number;
        bestUploader?: {
            count: number;
            user: UserObjShort;
        };
    };
}

const defaultPeriodStats:PeriodStats = {
    storageUsed: 0,
    image: {
        total: 0,
        bestUploader: undefined
    },
    paste: {
        total: 0,
        bestUploader: undefined
    },
    url: {
        total: 0,
        bestUploader: undefined
    }
}

export default defaultPeriodStats;