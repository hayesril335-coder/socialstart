import { Navigate, Route, Routes } from 'react-router-dom'
import { MainAppLayout } from '../layouts/MainAppLayout'
import { AuthPage } from '../pages/auth/AuthPages'
import { CreateHubPage, EarnPointsPage, MediaCreatePage, OneForOnePage } from '../pages/create/CreatePages'
import { ConversationPage, InboxPage } from '../pages/inbox/InboxPages'
import { LivePage, NotificationsPage } from '../pages/MiscPages'
import { PostDetailsPage } from '../pages/posts/PostDetailsPage'
import { StoryPage } from '../pages/posts/StoryPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { SearchPage } from '../pages/search/SearchPage'
import { SettingsDetailPage, SettingsPage } from '../pages/settings/SettingsPages'
import { CheckoutPage, ManageStorePage, ProductDetailsPage, StorePage } from '../pages/store/StorePages'
export function AppRoutes(){return <Routes>
 <Route path="/login" element={<AuthPage/>}/><Route path="/signup" element={<AuthPage signup/>}/><Route path="/auth/google/callback" element={<Navigate to="/search"/>}/>
 <Route path="/" element={<Navigate to="/login"/>}/>
 <Route element={<MainAppLayout/>}><Route path="/search" element={<SearchPage/>}/><Route path="/post/:postId" element={<PostDetailsPage/>}/><Route path="/profile" element={<ProfilePage/>}/><Route path="/profile/:username" element={<ProfilePage/>}/><Route path="/profile/:username/story" element={<StoryPage/>}/>
 <Route path="/create" element={<CreateHubPage/>}/>{['photo','video','story','post'].map(x=><Route key={x} path={`/create/${x}`} element={<MediaCreatePage/>}/>)}
 <Route path="/create/one-for-one" element={<OneForOnePage/>}/><Route path="/create/one-for-one/upload" element={<MediaCreatePage/>}/><Route path="/create/one-for-one/earn" element={<EarnPointsPage/>}/><Route path="/create/live" element={<LivePage/>}/>
 <Route path="/inbox" element={<InboxPage/>}/><Route path="/inbox/:conversationId" element={<ConversationPage/>}/><Route path="/settings" element={<SettingsPage/>}/>{['profile','account','billing','address','security'].map(x=><Route key={x} path={`/settings/${x}`} element={<SettingsDetailPage type={x[0].toUpperCase()+x.slice(1)}/>}/>)}
 <Route path="/settings/wallet" element={<SettingsDetailPage type="Wallet"/>}/><Route path="/store/:username" element={<StorePage/>}/><Route path="/store/:username/product/:productId" element={<ProductDetailsPage/>}/><Route path="/store/:username/manage" element={<ManageStorePage/>}/><Route path="/store/:username/product/new" element={<ManageStorePage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/>
 </Route><Route path="*" element={<Navigate to="/login"/>}/>
 </Routes>}
