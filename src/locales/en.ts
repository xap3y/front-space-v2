import LanguageModel from "@/types/LanguageModel";

const en = {
    pages: {
        login: {
            title: "XAP3Y - Space",
            under_title: "Sign in to continue",
            email_placeholder: "Email address",
            password_placeholder: "Password",
            no_account: "Don't have an account?",
            signup_text: "Sign up",
            button_text: "Sign In",
            forgot_password: "Forgot password?",
            user_not_found: "User not found",
            wrong_password: "Wrong password",
            short_password: "Password is too short",
            success: "Login successful"
        },
        user: {
            total_images_text: "Total images",
            total_pastes_text: "Total pastes",
            total_short_urls_text: "Total short URLs",
            joined_date_text: "Joined date",
            storage_used_text: "Storage used",
        },
        portable_url: {
            title: "URL Shortener",
            original_url_placeholder: "Original URL",
            button_text: "Short URL"
        },
        portable_paste: {
            title: "Paste Creator",
            title_input_placeholder: "Title",
            paste_input_placeholder: "Paste",
            button_text: "Create Paste",
            invalid_paste_length_alert: "Invalid Paste length!",
            invalid_title_length_alert: "Invalid Title length!",
            paste_created_alert: "Paste created",
            view_paste_text: "View created paste:"
        },
        portable_image: {
            drag_and_drop_text: "Drag & drop an image here or click to select",
            button_text: "Upload Image",
            image_uploaded_alert: "Image uploaded successfully"
        },
        user_finder: {
            title: "User Finder",
            subtitle: "Find a user by their username or UID",
            input_placeholder: "Username | UID",
            button_text: "Find User",
            no_user_found_error: "User not found",
            empty_field_error: "Please enter username or UID"
        },
        image_viewer: {
            uploaded_by: "Uploaded by",
            uploaded_on: "Uploaded on",
            download_button_text: "Download",
            copy_button_text: "Copy",
            report_button_text: "Report",
            download_alert: "Downloading...",
            password_required: "This image is password protected",
            password_placeholder: "Enter password",
            view_image_button_placeholder: "View Image",
        },
        image_finder: {
            title: "Image Finder",
            subtitle: "Find an image by its unique identifier",
            input_placeholder: "Image Unique ID",
            button_text: "Lookup Image",
            no_image_found_error: "Image not found!",
            empty_field_error: "Please enter a uniqueId"
        },
        profile: {
            title: "Account overview"
        }
    },
    global: {
        api_key_input_placeholder: "API Key",
        processing_button_text: "Processing...",
        bad_api_key_alert: "Invalid API Key",
        invited_by_text: "Invited by",
        total_images_text: "Total images",
        total_pastes_text: "Total pastes",
        total_short_urls_text: "Total short URLs",
        joined_date_text: "Joined date",
        storage_used_text: "Storage used",
        click_to_copy: "Click to copy",
        click_to_show: "Click to show",
        click_to_hide: "Click to hide",
        member_since: "Member since",
        click_to_edit: "Click to edit",
        click_to_save: "Click to save",
        click_to_delete: "Click to delete",
        not_connected_text: "Not connected",
        disabled_text: "Disabled",
    },
    toasts: {
        error: {
            changing_theme: "Switching theme...",
            change_theme: "Failed to change theme",
            email_change: "Failed to change email",
            invalid_password: "Invalid password",
        },
        success: {
            copied_to_clipboard: "Copied to clipboard",
            change_theme: "Theme changed",
            language_changed: "Language changed to: ",
            email_change: "Email changed successfully",
            password: "missing password",
        },
        loading: {
            fetching_image: "Fetching image...",
        }
    },
    comp: {
        sidebar: {
            home: "Home",
            images: "Images",
            pastes: "Pastes",
            short_urls: "Shortened URLs",
            settings: "Settings",
            profile: "Profile",
            logout: "Logout"
        }
    }
};

export default en;