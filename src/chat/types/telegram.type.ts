export interface TelegramUpdate {
	update_id: number;
	message?: TelegramMessage;
	edited_message?: TelegramMessage;
	channel_post?: TelegramMessage;
	edited_channel_post?: TelegramMessage;
	business_connection?: any; // BusinessConnection
	business_message?: TelegramMessage;
	edited_business_message?: TelegramMessage;
	deleted_business_messages?: any; // BusinessMessagesDeleted;
	message_reaction?: any; // MessageReactionUpdated;
	message_reaction_count?: any; // MessageReactionCountUpdated;
	inline_query?: any; // InlineQuery;
	chosen_inline_result?: any; // ChosenInlineResult;
	callback_query?: any; // CallbackQuery;
	shipping_query?: any; // ShippingQuery;
	pre_checkout_query?: any; // PreCheckoutQuery;
	purchased_paid_media?: any; // PaidMediaPurchased;
	poll?: any; // Poll;
	poll_answer?: any; // PollAnswer;
	my_chat_member?: any; // ChatMemberUpdated;
	chat_member?: any; // ChatMemberUpdated;
	chat_join_request?: any; // ChatJoinRequest;
	chat_boost?: any; // ChatBoostUpdated;
	removed_chat_boost?: any; // ChatBoostRemoved;
}

export interface TelegramMessage {
	message_id: number;
	message_thread_id?: number;
	from?: any; // User;
	sender_chat?: TelegramChat;
	sender_boost_count?: number;
	sender_business_bot?: any; // User;
	date: number;
	business_connection_id?: string;
	chat: TelegramChat;
	forward_origin?: any; // MessageOrigin;
	is_topic_message?: true;
	is_automatic_forward?: true;
	reply_to_message?: TelegramMessage;
	external_reply?: any; // ExternalReplyInfo;
	quote?: any; // TextQuote;
	reply_to_story?: any; // Story;
	via_bot?: any; // User;
	edit_date?: number;
	has_protected_content?: true;
	is_from_offline?: true;
	media_group_id?: string;
	author_signature?: string;
	paid_star_count?: number;
	text?: string;
	entities?: TelegramMessageEntity[];
	link_preview_options?: any; // LinkPreviewOptions;
	effect_id?: string;
	animation?: Animation;
	audio?: any; // Audio;
	document?: Document;
	paid_media?: any; // PaidMediaInfo;
	photo?: any; // PhotoSize[];
	sticker?: any; // Sticker;
	story?: any; // Story;
	video?: any; // Video;
	video_note?: any; // VideoNote;
	voice?: any; // Voice;
	caption?: string;
	caption_entities?: any; // MessageEntity[];
	show_caption_above_media?: true;
	has_media_spoiler?: true;
	checklist?: any; // Checklist;
	contact?: any; // Contact;
	dice?: any; // Dice;
	game?: any; // Game;
	poll?: any; // Poll;
	venue?: any; // Venue;
	location?: Location;
	new_chat_members?: any; // User[];
	left_chat_member?: any; // User;
	new_chat_title?: string;
	new_chat_photo?: any; // PhotoSize[];
	delete_chat_photo?: true;
	group_chat_created?: true;
	supergroup_chat_created?: true;
	channel_chat_created?: true;
	message_auto_delete_timer_changed?: any; //MessageAutoDeleteTimerChanged;
	migrate_to_chat_id?: number;
	migrate_from_chat_id?: number;
	pinned_message?: any; // MaybeInaccessibleMessage;
	invoice?: any; // Invoice;
	successful_payment?: any; // SuccessfulPayment;
	refunded_payment?: any; //RefundedPayment;
	users_shared?: any; // UsersShared;
	chat_shared?: any; // ChatShared;
	gift?: any; // GiftInfo;
	unique_gift?: any; // UniqueGiftInfo;
	connected_website?: string;
	write_access_allowed?: any; //WriteAccessAllowed;
	passport_data?: any; // PassportData;
	proximity_alert_triggered?: any; // ProximityAlertTriggered;
	boost_added?: any; //ChatBoostAdded;
	chat_background_set?: any; // ChatBackground;
	checklist_tasks_done?: any; // ChecklistTasksDone;
	checklist_tasks_added?: any; //ChecklistTasksAdded;
	direct_message_price_changed?: any; // DirectMessagePriceChanged;
	forum_topic_created?: any; // ForumTopicCreated;
	forum_topic_edited?: any; //ForumTopicEdited;
	forum_topic_closed?: any; //ForumTopicClosed;
	forum_topic_reopened?: any; //ForumTopicReopened;
	general_forum_topic_hidden?: any; //GeneralForumTopicHidden;
	general_forum_topic_unhidden?: any; //GeneralForumTopicUnhidden;
	giveaway_created?: any; //GiveawayCreated;
	giveaway?: any; //Giveaway;
	giveaway_winners?: any; //GiveawayWinners;
	giveaway_completed?: any; //GiveawayCompleted;
	paid_message_price_changed?: any; // PaidMessagePriceChanged;
	video_chat_scheduled?: any; //VideoChatScheduled;
	video_chat_started?: any; //VideoChatStarted;
	video_chat_ended?: any; //VideoChatEnded;
	video_chat_participants_invited?: any; //VideoChatParticipantsInvited;
	web_app_data?: any; // WebAppData;
	reply_markup?: any; //InlineKeyboardMarkup;
}

interface TelegramChat {
	id: number;
	type: "private" | "group" | "supergroup" | "channel";
	title?: string;
	username?: string;
	first_name?: string;
	last_name?: string;
	is_forum?: true;
}

interface TelegramMessageEntity {
	type:
		| "mention"
		| "hashtag"
		| "cashtag"
		| "bot_command"
		| "url"
		| "email"
		| "phone_number"
		| "bold"
		| "italic"
		| "underline"
		| "strikethrough"
		| "spoiler"
		| "blockquote"
		| "expandable_blockquote"
		| "code"
		| "pre"
		| "text_link"
		| "text_mention"
		| "custom_emoji";
	offset: number;
	length: number;
	url?: string;
	user?: any; // User;
	language?: string;
	custom_emoji_id?: string;
}
