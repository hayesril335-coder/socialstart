import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { MainAppLayout } from '../layouts/MainAppLayout'
import { AuthPage } from '../pages/auth/AuthPages'
import { CreateHubPage, MediaCreatePage } from '../pages/create/CreatePages'
import { EarnViewPointsPage, OneForOneDashboard } from '../pages/create/OneForOnePages'
import { ConversationPage, InboxPage } from '../pages/inbox/InboxPages'
import { LivePage, NotificationsPage } from '../pages/MiscPages'
import { PostDetailsPage } from '../pages/posts/PostDetailsPage'
import { StoryPage } from '../pages/posts/StoryPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { MembershipPage } from '../pages/profile/MembershipPage'
import { MembershipCheckoutPage } from '../pages/profile/MembershipCheckoutPage'
import { SearchPage } from '../pages/search/SearchPage'
import { MembershipSubscriptionsPage, SettingsDetailPage, SettingsPage } from '../pages/settings/SettingsPages'
import { CheckoutPage, ManageStorePage, ProductDetailsPage, StorePage } from '../pages/store/StorePages'
import { CreatedHashtagsPage, FollowedHashtagsPage, HashtagPage } from '../pages/hashtags/HashtagPages'
function RequireAuth(){return localStorage.getItem('socialstart-authenticated')==='true'?<Outlet/>:<Navigate to="/login" replace/>}
export function AppRoutes(){return <Routes>
 <Route path="/login" element={<AuthPage/>}/><Route path="/signup" element={<AuthPage signup/>}/>
 <Route path="/" element={<Navigate to="/login"/>}/>
 <Route element={<RequireAuth/>}><Route element={<MainAppLayout/>}><Route path="/search" element={<SearchPage/>}/><Route path="/post/:postId" element={<PostDetailsPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/profile/:username" element={<ProfilePage/>}/><Route path="/profile/:username/story" element={<StoryPage/>}/>
 <Route path="/create" element={<CreateHubPage/>}/>{['photo','video','story','post'].map(x=><Route key={x} path={`/create/${x}`} element={<MediaCreatePage/>}/>)}
 <Route path="/create/one-for-one" element={<OneForOneDashboard/>}/><Route path="/create/one-for-one/upload" element={<MediaCreatePage/>}/><Route path="/create/one-for-one/earn" element={<EarnViewPointsPage/>}/><Route path="/create/live" element={<LivePage/>}/>
 <Route path="/membership/setup" element={<MembershipPage/>}/>
 <Route path="/membership/:username/checkout" element={<MembershipCheckoutPage/>}/>
 <Route path="/hashtags" element={<FollowedHashtagsPage/>}/><Route path="/hashtags/created" element={<CreatedHashtagsPage/>}/><Route path="/hashtag/:tag" element={<HashtagPage/>}/>
 <Route path="/inbox" element={<InboxPage/>}/><Route path="/inbox/:conversationId" element={<ConversationPage/>}/><Route path="/settings" element={<SettingsPage/>}/>{['profile','account','billing','address','security','devices'].map(x=><Route key={x} path={`/settings/${x}`} element={<SettingsDetailPage type={x[0].toUpperCase()+x.slice(1)}/>}/>)}
 <Route path="/settings/wallet" element={<SettingsDetailPage type="Wallet"/>}/><Route path="/settings/memberships" element={<MembershipSubscriptionsPage/>}/><Route path="/store/:username" element={<StorePage/>}/><Route path="/store/:username/product/:productId" element={<ProductDetailsPage/>}/><Route path="/store/:username/manage" element={<ManageStorePage/>}/><Route path="/store/:username/product/new" element={<ManageStorePage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/>
 </Route></Route><Route path="*" element={<Navigate to="/login"/>}/>
 </Routes>}
