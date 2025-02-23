'use client';
import { createContext, useContext, useState } from 'react';
import {UploadedImage} from "@/types/image";

const ImageContext = createContext<{
    image: UploadedImage | null;
    setImage: (image: UploadedImage | null) => void;
}>({
    image: null,
    setImage: () => {},
});

export const ImageProvider = ({ children }: { children: React.ReactNode }) => {
    const [image, setImage] = useState<UploadedImage | null>(null);

    return (
        <ImageContext.Provider value={{ image, setImage }}>
            {children}
        </ImageContext.Provider>
    );
};

export const useImage = () => useContext(ImageContext);