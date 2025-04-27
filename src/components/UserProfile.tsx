import {
    FaDiscord,
    FaFacebook,
    FaGithub,
    FaLinkedin,
    FaReddit,
    FaSnapchatGhost,
    FaSoundcloud,
    FaSpotify,
    FaTelegram,
    FaTwitch,
    FaVk,
    FaWhatsapp,
    FaYoutube
} from 'react-icons/fa';
import {FaEarthAmericas, FaThreads, FaXTwitter} from "react-icons/fa6";
import {CiMail} from "react-icons/ci";
import {SocialLinkButton} from "@/components/SocialLinkButton";
import {UserObj} from "@/types/user";
import {useTranslation} from "@/hooks/useTranslation";
import {getUserRoleBadge} from "@/lib/client";
import {UserPopupCard} from "@/components/UserPopupCard";
import {useState} from "react";

interface Props {
    user: UserObj
}

export function UserProfile({ user }: Props) {

    const [showCard, setShowCard] = useState(false);
    const [position, setPosition] = useState({ x: 1212, y: 530 });
    const handleMouseEnter = () => setShowCard(true);
    const handleMouseLeave = () => setShowCard(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
    };
    const lang = useTranslation();
    const iconSize = 32;

    const userBadge = getUserRoleBadge(user.role);

    return (
        <div
            className="flex flex-col items-center w-full max-w-lg p-6 mx-auto bg-primary_light text-gray-200 rounded-lg shadow-lg">

            {/* Profile Picture */}
            <img
                src={(user.avatar ? user.avatar : "/images/default-avatar.svg")}
                alt={`${user.username}'s avatar`}
                className="w-24 h-24 rounded-full shadow-lg border-4 border-gray-700 text-center leading-10"
            />

            {user.role == "BANNED" || user.role == "DELETED"
                ? <h1 className="mt-4 text-3xl font-semibold text-red-700 line-through">{user.username}</h1>
                : <h1 className="mt-4 text-3xl font-semibold">{user.username}</h1>
            }

            <span className="text-sm font-medium px-2.5 rounded mt-1 mb-4">
                    {"UID: " + user.uid}
                </span>

            {userBadge}

            {/*<p className="text-gray-400">{user.role}</p>*/}

            {/* Stats */}
            <div onMouseMove={handleMouseMove} className="w-full mt-6 text-lg font-parkinsans">
                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>{lang.pages.user.total_images_text}:</span>
                    <span className={"font-bold"}>{user.stats.totalUploads}</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>{lang.pages.user.total_pastes_text}:</span>
                    <span className={"font-bold"}>{user.stats.pastesCreated}</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>{lang.pages.user.total_short_urls_text}:</span>
                    <span className={"font-bold"}>{user.stats.urlsShortened}</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>{lang.pages.user.joined_date_text}:</span>
                    <span className={"font-bold"}>{new Date(user.createdAt).toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>{lang.pages.user.storage_used_text}:</span>
                    <span className={"font-bold"}>{(user.stats.storageUsed / 1024 / 1024).toFixed(2) + " MB"}</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>{lang.global.invited_by_text}:</span>
                    {user.invitor == null
                        ? <span className={"text-primary-brighter font-bold"}>N/A</span>
                        : <a onMouseEnter={handleMouseEnter}
                             onMouseLeave={handleMouseLeave}
                             className={"decoration-0 text-blue-600 font-bold"}
                             href={"/user/" + user.invitor.username}
                        >
                            {user.invitor.username + " (" + user.invitor.uid + ")"}
                        </a>
                    }
                </div>
            </div>

            {/* Social Links */}
            {
                user.socials && (
                    <div className="flex flex-wrap justify-center gap-4 mt-6">

                        {user.socials.website && (
                            <SocialLinkButton href={user.socials.website}>
                                <FaEarthAmericas size={iconSize}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.email && (
                            <SocialLinkButton href={`mailto:${user.socials.email}`}>
                                <CiMail size={iconSize}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.instagram && (
                            <SocialLinkButton href={`https://instagram.com/${user.socials.instagram}`}>
                                <img alt={"IG"} width={iconSize} height={iconSize}
                                     src={"/icons/instagram.svg"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.twitter && (
                            <SocialLinkButton href={`https://twitter.com/${user.socials.twitter}`}>
                                <FaXTwitter size={iconSize}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.threads && (
                            <SocialLinkButton href={`https://www.threads.net/@${user.socials.threads}`}>
                                <FaThreads size={iconSize}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.telegram && (
                            <SocialLinkButton href={`https://t.me/${user.socials.telegram}`}>
                                <FaTelegram size={iconSize} color={"#24A1DE"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.discord && (
                            <SocialLinkButton href={`https://discord.gg/${user.socials.discord}`}>
                                <FaDiscord size={iconSize} color={"#7289da"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.soundcloud && (
                            <SocialLinkButton href={`https://soundcloud.com/${user.socials.soundcloud}`}>
                                <FaSoundcloud size={iconSize} color={"#ff5500"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.spotify && (
                            <SocialLinkButton href={`https://open.spotify.com/user/${user.socials.spotify}`}>
                                <FaSpotify size={iconSize} color={"#1DB954"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.github && (
                            <SocialLinkButton href={`https://github.com/${user.socials.github}`}>
                                <FaGithub title={"github"} size={iconSize}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.gitlab && (
                            <SocialLinkButton href={`https://gitlab.com/${user.socials.gitlab}`}>
                                {/*<FaGitlab size={iconSize}/>*/}
                                <img src={"/icons/gitlab.svg"}
                                     alt={"GitLab"}
                                     width={iconSize}
                                     height={iconSize}
                                     title={"gitlab"}
                                />
                            </SocialLinkButton>
                        )}
                        {user.socials.reddit && (
                            <SocialLinkButton href={`https://reddit.com/user/${user.socials.reddit}`}>
                                <FaReddit size={iconSize} color={"#FF5700"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.snapchat && (
                            <SocialLinkButton href={`https://snapchat.com/add/${user.socials.snapchat}`}>
                                <FaSnapchatGhost size={iconSize} color={"#FFFC00"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.youtube && (
                            <SocialLinkButton href={`https://youtube.com/${user.socials.youtube}`}>
                                <FaYoutube size={iconSize} color={"#FF0000"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.steam && (
                            <SocialLinkButton href={`https://steamcommunity.com/id/${user.socials.steam}`}>
                                {/*<FaSteam size={iconSize} color={"#008ABE"}/>*/}
                                <img
                                    src={"/icons/steam.svg"}
                                    alt={"Steam"}
                                    width={iconSize}
                                    height={iconSize}
                                    title={"steam"}
                                />
                            </SocialLinkButton>
                        )}
                        {user.socials.messenger && (
                            <SocialLinkButton href={`https://m.me/${user.socials.messenger}`}>
                                {/*<FaFacebookMessenger size={iconSize} color={"#00B2FF"}/>*/}
                                <img
                                    src={"/icons/messenger.svg"}
                                    alt={"Messenger"}
                                    width={iconSize}
                                    height={iconSize}
                                />
                            </SocialLinkButton>
                        )}
                        {user.socials.linkedin && (
                            <SocialLinkButton href={`https://linkedin.com/in/${user.socials.linkedin}`}>
                                <FaLinkedin size={iconSize} color={"#0077B5"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.twitch && (
                            <SocialLinkButton href={`https://twitch.tv/${user.socials.twitch}`}>
                                <FaTwitch size={iconSize} color={"#6441a5"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.tiktok && (
                            <SocialLinkButton href={`https://tiktok.com/@${user.socials.tiktok}`}>
                                {/*<FaTiktok size={iconSize} color={"black"}/>*/}
                                <img
                                    src={"/icons/tiktok.svg"}
                                    alt={"TikTok"}
                                    width={iconSize - 5}
                                    height={iconSize - 5}
                                />
                            </SocialLinkButton>
                        )}
                        {user.socials.whatsapp && (
                            <SocialLinkButton href={`https://wa.me/${user.socials.whatsapp}`}>
                                <FaWhatsapp title={"Whatsapp"} size={iconSize} color={"#25D366"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.facebook && (
                            <SocialLinkButton href={`https://facebook.com/${user.socials.facebook}`}>
                                <FaFacebook title={"Facebook"} size={iconSize} color={"#1877F2"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.vk && (
                            <SocialLinkButton href={`https://vk.com/${user.socials.vk}`}>
                                <FaVk title={"vk"} size={iconSize} color={"#0077FF"}/>
                            </SocialLinkButton>
                        )}
                    </div>
                )
            }

            {
                user.invitor && (
                    <div
                        className={`pointer-events-none transition-all duration-200 ease-out transform ${
                            showCard ? "opacity-100 scale-100" : "opacity-0 scale-95"
                        } absolute bg-secondary shadow-lg border rounded-xl p-4 z-50 flex flex-row gap-4`}
                        style={{ top: position.y + 10, left: position.x + 20 }}
                    >
                        <UserPopupCard user={user.invitor as UserObj} lang={lang} />
                    </div>
                )
            }
        </div>
    );
}