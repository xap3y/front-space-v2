import { FaTelegram, FaGithub, FaSnapchatGhost, FaReddit, FaDiscord,
    FaSoundcloud, FaSpotify, FaYoutube, FaSteam, FaInstagram,
    FaFacebookMessenger, FaLinkedin, FaTwitch, FaVk, FaWhatsapp, FaFacebook} from 'react-icons/fa';
import { FaThreads, FaGitlab, FaXTwitter, FaEarthAmericas, FaTiktok } from "react-icons/fa6";
import { CiMail } from "react-icons/ci";
import { SocialLinkButton } from "@/components/SocialLinkButton";
import {UserObj} from "@/types/user";

interface Props {
    user: UserObj
}

export function UserProfile({ user }: Props) {

    const iconSize = 32;

    return (
        <div
            className="flex flex-col items-center w-full max-w-lg p-6 mx-auto bg-primary_light text-gray-200 rounded-lg shadow-lg">

            {/* Profile Picture */}
            <img
                src={(user.avatar ? user.avatar : "https://www.gravatar.com/avatar/")}
                alt={`${user.username}'s profile`}
                className="w-24 h-24 rounded-full shadow-lg border-4 border-gray-700 text-center leading-10"
            />

            {user.role == "BANNED" || user.role == "DELETED"
                ? <h1 className="mt-4 text-3xl font-semibold text-red-700 line-through">{user.username}</h1>
                : <h1 className="mt-4 text-3xl font-semibold">{user.username}</h1>
            }

            <span className="text-sm font-medium px-2.5 rounded mt-1 mb-4">
                    {"UID: " + user.uid}
                </span>

            {user.role == "OWNER" && (
                <span
                    className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">
                    owner
                </span>
            )}
            {user.role == "ADMIN" && (
                <span
                    className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                    admin
                </span>
            )}

            {user.role == "USER" && (
                /*<span className='bg-transparent text-amber-600 border border-amber-400 text-lg ml-2 font-medium mr-2 px-1.5 rounded-full py-1'>
                    owner
                </span>*/
                <span
                    className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                    user
                </span>
            )}

            {user.role == "MODERATOR" && (
                /*<span className='bg-transparent text-amber-600 border border-amber-400 text-lg ml-2 font-medium mr-2 px-1.5 rounded-full py-1'>
                    owner
                </span>*/
                <span className="bg-blue-500 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    moderator
                </span>
            )}

            {user.role == "GUEST" && (
                /*<span className='bg-transparent text-amber-600 border border-amber-400 text-lg ml-2 font-medium mr-2 px-1.5 rounded-full py-1'>
                    owner
                </span>*/
                <span className="bg-primary-darker text-white text-xs font-medium px-2.5 py-0.5 rounded">
                    guest
                </span>
            )}

            {user.role == "BANNED" && (
                /*<span className='bg-transparent text-amber-600 border border-amber-400 text-lg ml-2 font-medium mr-2 px-1.5 rounded-full py-1'>
                    owner
                </span>*/
                <span className="bg-red-600 text-gray-800 text-xs px-2.5 py-0.5 rounded font-parkinsans font-bold">
                    BANNED
                </span>
            )}

            {user.role == "DELETED" && (
                /*<span className='bg-transparent text-amber-600 border border-amber-400 text-lg ml-2 font-medium mr-2 px-1.5 rounded-full py-1'>
                    owner
                </span>*/
                <span className="bg-red-600 text-gray-800 text-xs px-2.5 py-0.5 rounded font-parkinsans font-bold">
                    DELETED
                </span>
            )}

            {user.role == "TESTER" && (
                /*<span className='bg-transparent text-amber-600 border border-amber-400 text-lg ml-2 font-medium mr-2 px-1.5 rounded-full py-1'>
                    owner
                </span>*/
                <span className={"flex gap-3"}>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        tester
                    </span>

                    <span
                        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300">
                        admin
                    </span>
                </span>
            )}

            {/*<p className="text-gray-400">{user.role}</p>*/}

            {/* Stats */}
            <div className="w-full mt-6 text-lg font-parkinsans font-bold">
                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>Total Images Uploaded:</span>
                    <span>0 MB</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>Joined Date:</span>
                    <span>{user.createdAt}</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>Storage Used:</span>
                    <span>0 MB</span>
                </div>

                <div className="flex justify-between border-b border-gray-600 py-2">
                    <span>Invited by:</span>
                    {user.invitor == null
                        ? <span className={"text-gray-600"}>N/A</span>
                        : <a className={"decoration-0 text-blue-600"} href={"/profile/" + user.invitor.username}>{user.invitor.username}</a>
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
                                     src={"https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg"}/>
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
                                <FaGithub size={iconSize}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.gitlab && (
                            <SocialLinkButton href={`https://gitlab.com/${user.socials.gitlab}`}>
                                {/*<FaGitlab size={iconSize}/>*/}
                                <img src={"https://upload.wikimedia.org/wikipedia/commons/3/35/GitLab_icon.svg"}
                                     alt={"GitLab"}
                                     width={iconSize}
                                     height={iconSize}
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
                                    src={"https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg"}
                                    alt={"Steam"}
                                    width={iconSize}
                                    height={iconSize}
                                />
                            </SocialLinkButton>
                        )}
                        {user.socials.messenger && (
                            <SocialLinkButton href={`https://m.me/${user.socials.messenger}`}>
                                {/*<FaFacebookMessenger size={iconSize} color={"#00B2FF"}/>*/}
                                <img
                                    src={"https://upload.wikimedia.org/wikipedia/commons/b/be/Facebook_Messenger_logo_2020.svg"}
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
                                    src={"https://logos.logofury.com/logo_src/024dcc7ab2bdb2db20498f046371cd08.svg"}
                                    alt={"TikTok"}
                                    width={iconSize - 5}
                                    height={iconSize - 5}
                                />
                            </SocialLinkButton>
                        )}
                        {user.socials.whatsapp && (
                            <SocialLinkButton href={`https://wa.me/${user.socials.whatsapp}`}>
                                <FaWhatsapp size={iconSize} color={"#25D366"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.facebook && (
                            <SocialLinkButton href={`https://facebook.com/${user.socials.facebook}`}>
                                <FaFacebook size={iconSize} color={"#1877F2"}/>
                            </SocialLinkButton>
                        )}
                        {user.socials.vk && (
                            <SocialLinkButton href={`https://vk.com/${user.socials.vk}`}>
                                <FaVk size={iconSize} color={"#0077FF"}/>
                            </SocialLinkButton>
                        )}
                    </div>
                )
            }
        </div>
    );
}