use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};
use streamflow_timelock::{
    associated_token::{cancel_token_stream, initialize_token_stream, withdraw_token_stream},
    state::{CancelAccounts, InitializeAccounts, StreamInstruction, WithdrawAccounts},
};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod timelock {
    use streamflow_timelock::associated_token::update_recipient;
    use streamflow_timelock::state::TransferAccounts;

    use super::*;

    pub fn create(
        ctx: Context<Create>,
        amount: u64,
        start_time: u64,
        end_time: u64,
        period: u64,
        cliff: u64,
        cliff_amount: u64,
    ) -> ProgramResult {
        let ix = StreamInstruction {
            start_time,
            end_time,
            deposited_amount: amount,
            total_amount: amount,
            period,
            cliff,
            cliff_amount,
        };

        let acc = InitializeAccounts {
            sender: ctx.accounts.sender.to_account_info(),
            sender_tokens: ctx.accounts.sender_tokens.to_account_info(),
            recipient: ctx.accounts.recipient.to_account_info(),
            recipient_tokens: ctx.accounts.recipient_tokens.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        initialize_token_stream(ctx.program_id, acc, ix)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        let acc = WithdrawAccounts {
            recipient: ctx.accounts.recipient.to_account_info(),
            recipient_tokens: ctx.accounts.recipient_tokens.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };

        withdraw_token_stream(ctx.program_id, acc, amount)
    }

    pub fn cancel(ctx: Context<Cancel>) -> ProgramResult {
        let acc = CancelAccounts {
            sender: ctx.accounts.sender.to_account_info(),
            sender_tokens: ctx.accounts.sender_tokens.to_account_info(),
            recipient: ctx.accounts.recipient.to_account_info(),
            recipient_tokens: ctx.accounts.recipient_tokens.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        cancel_token_stream(ctx.program_id, acc)
    }

    pub fn transfer_recipient(ctx: Context<Transfer>) -> ProgramResult {
        let acc = TransferAccounts {
            existing_recipient: ctx.accounts.existing_recipient.to_account_info(),
            new_recipient: ctx.accounts.new_recipient.to_account_info(),
            new_recipient_tokens: ctx.accounts.new_recipient_tokens.to_account_info(),
            metadata: ctx.accounts.metadata.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
            system_program: ctx.accounts.system.to_account_info(),
        };

        update_recipient(ctx.program_id, acc)
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_tokens: AccountInfo<'info>,
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    #[account(mut)]
    pub recipient_tokens: AccountInfo<'info>,
    #[account(mut, signer)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_tokens: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
    pub timelock_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,
    #[account(mut)]
    pub recipient_tokens: Account<'info, TokenAccount>,
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_tokens: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Cancel<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_tokens: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    #[account(mut)]
    pub recipient_tokens: Account<'info, TokenAccount>,
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_tokens: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub existing_recipient: Signer<'info>,
    #[account(mut)]
    pub new_recipient: AccountInfo<'info>,
    #[account(mut)]
    pub new_recipient_tokens: AccountInfo<'info>,
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    #[account(mut)]
    pub escrow_tokens: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system: Program<'info, System>,
}
